import { createMiddleware } from 'hono/factory';
import type { Env, HonoVariables } from '../types';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Classe Durable Object exportada para o runtime Cloudflare Workers
// Garante execução atômica com isolamento e estado fortemente consistente na borda
export class RateLimiterDO {
  state: any;
  inMemoryFallback: Map<string, RateLimitRecord>;
  locks: Map<string, Promise<void>>;

  constructor(state: any) {
    this.state = state;
    this.inMemoryFallback = new Map();
    this.locks = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') || 'default';
    const max = parseInt(url.searchParams.get('max') || '60', 10);
    const windowSeconds = parseInt(url.searchParams.get('window') || '60', 10);
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Mutex serializado por chave para garantir atomicidade sob concorrência rigorosa (P1 Item 4)
    let releaseLock: () => void = () => {};
    const previousLock = this.locks.get(key) || Promise.resolve();
    const currentLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.locks.set(
      key,
      previousLock.then(() => currentLock)
    );
    await previousLock;

    let record: RateLimitRecord | undefined;
    try {
      // Recupera registro do armazenamento persistente do Durable Object (P1 Item 4)
      if (this.state?.storage) {
        record = await this.state.storage.get(key);
      } else {
        record = this.inMemoryFallback.get(key);
      }

      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + windowMs };
      } else {
        record = { count: record.count + 1, resetAt: record.resetAt };
      }

      // Grava atomicamente no storage persistente do Durable Object
      if (this.state?.storage) {
        await this.state.storage.put(key, record);
      } else {
        this.inMemoryFallback.set(key, record);
      }
    } finally {
      releaseLock();
    }

    const allowed = record.count <= max;
    const remaining = Math.max(0, max - record.count);
    const resetTimestamp = Math.ceil(record.resetAt / 1000);
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);

    return new Response(
      JSON.stringify({
        allowed,
        count: record.count,
        remaining,
        resetTimestamp,
        retryAfter: allowed ? 0 : retryAfter,
      }),
      {
        status: allowed ? 200 : 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetTimestamp.toString(),
          ...(allowed ? {} : { 'Retry-After': retryAfter.toString() }),
        },
      }
    );
  }
}

// Fallback in-memory exclusivo para ambiente local de desenvolvimento ou testes unitários
const localDevStore = new Map<string, RateLimitRecord>();

export function resetRateLimiterStore() {
  localDevStore.clear();
}

export function rateLimiter(options: { max: number; windowSeconds: number; keyPrefix?: string }) {
  const { max, windowSeconds, keyPrefix = 'rl' } = options;
  const windowMs = windowSeconds * 1000;

  return createMiddleware<{ Bindings: Env; Variables: HonoVariables }>(async (c, next) => {
    // Em testes unitários isolados, não aplica throttling a menos que explicitamente testando o middleware
    if (c.env?.ENVIRONMENT === 'test' && !c.env?.RATE_LIMITER_DO && !c.req.header('X-Test-Rate-Limit')) {
      await next();
      return;
    }

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    const isProductionOrStaging =
      c.env?.ENVIRONMENT === 'production' || c.env?.ENVIRONMENT === 'staging';

    // 1. Arquitetura Primária Obrigatória para Staging/Produção: Cloudflare Durable Objects (P1 Item 4)
    // Em produção/staging: NUNCA permite fallback para KV nem bypass desprotegido
    if (isProductionOrStaging) {
      if (!c.env?.RATE_LIMITER_DO) {
        return c.json(
          { error: 'Configuração de proteção de requisições (Durable Object) obrigatória em produção/staging.' },
          503
        );
      }

      try {
        const doKey = `${keyPrefix}:${ip}`;
        const id = c.env.RATE_LIMITER_DO.idFromName(doKey);
        const stub = c.env.RATE_LIMITER_DO.get(id);

        const res = await stub.fetch(
          `https://do-ratelimit.internal/?key=${encodeURIComponent(doKey)}&max=${max}&window=${windowSeconds}`
        );

        c.header('X-RateLimit-Limit', res.headers.get('X-RateLimit-Limit') || max.toString());
        c.header('X-RateLimit-Remaining', res.headers.get('X-RateLimit-Remaining') || '0');
        c.header('X-RateLimit-Reset', res.headers.get('X-RateLimit-Reset') || '');

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After') || windowSeconds.toString();
          c.header('Retry-After', retryAfter);
          return c.json(
            {
              error: 'Muitas requisições. Por favor, aguarde alguns instantes antes de tentar novamente.',
              retryAfterSeconds: parseInt(retryAfter, 10),
            },
            429
          );
        }

        await next();
        return;
      } catch (doErr) {
        console.error('[RATE_LIMITER_DO_FAIL]', doErr);
        return c.json(
          { error: 'Serviço de proteção de requisições temporariamente indisponível.' },
          503
        );
      }
    }

    // 2. Ambiente de Desenvolvimento / Testes Unitários
    if (c.env?.RATE_LIMITER_DO) {
      try {
        const doKey = `${keyPrefix}:${ip}`;
        const id = c.env.RATE_LIMITER_DO.idFromName(doKey);
        const stub = c.env.RATE_LIMITER_DO.get(id);

        const res = await stub.fetch(
          `https://do-ratelimit.internal/?key=${encodeURIComponent(doKey)}&max=${max}&window=${windowSeconds}`
        );

        c.header('X-RateLimit-Limit', res.headers.get('X-RateLimit-Limit') || max.toString());
        c.header('X-RateLimit-Remaining', res.headers.get('X-RateLimit-Remaining') || '0');
        c.header('X-RateLimit-Reset', res.headers.get('X-RateLimit-Reset') || '');

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After') || windowSeconds.toString();
          c.header('Retry-After', retryAfter);
          return c.json(
            {
              error: 'Muitas requisições. Por favor, aguarde alguns instantes antes de tentar novamente.',
              retryAfterSeconds: parseInt(retryAfter, 10),
            },
            429
          );
        }

        await next();
        return;
      } catch (doErr) {
        console.error('[DEV_RATE_LIMITER_DO_FAIL]', doErr);
      }
    }

    if (c.env?.RATE_LIMIT_KV) {
      // KV exclusivamente permitido em desenvolvimento se configurado
      const now = Date.now();
      const currentWindow = Math.floor(now / windowMs);
      const kvKey = `ratelimit:${keyPrefix}:${ip}:${currentWindow}`;
      const countRaw = await c.env.RATE_LIMIT_KV.get(kvKey);
      const currentCount = countRaw ? parseInt(countRaw, 10) : 0;
      const newCount = currentCount + 1;
      await c.env.RATE_LIMIT_KV.put(kvKey, newCount.toString(), {
        expirationTtl: Math.max(60, windowSeconds * 2),
      });

      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, max - newCount).toString());
      c.header('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());

      if (newCount > max) {
        c.header('Retry-After', windowSeconds.toString());
        return c.json(
          {
            error: 'Muitas requisições. Por favor, aguarde alguns instantes antes de tentar novamente.',
            retryAfterSeconds: windowSeconds,
          },
          429
        );
      }
      await next();
      return;
    } else {
      // 2. Ambiente de desenvolvimento local (Fallback controlado)
      const now = Date.now();
      const localKey = `${keyPrefix}:${ip}`;
      let record = localDevStore.get(localKey);
      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + windowMs };
      } else {
        record.count += 1;
      }
      localDevStore.set(localKey, record);

      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
      c.header('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());

      if (record.count > max) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        c.header('Retry-After', retryAfter.toString());
        return c.json(
          {
            error: 'Muitas requisições. Por favor, aguarde alguns instantes antes de tentar novamente.',
            retryAfterSeconds: retryAfter,
          },
          429
        );
      }
    }

    await next();
  });
}
