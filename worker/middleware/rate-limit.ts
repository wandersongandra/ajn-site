import { createMiddleware } from 'hono/factory';
import type { Env, HonoVariables } from '../types';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Fallback in-memory para ambiente local ou quando KV/Cache não estiver disponível
const memoryStore = new Map<string, RateLimitRecord>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export function rateLimiter(options: { max: number; windowSeconds: number; keyPrefix?: string }) {
  const { max, windowSeconds, keyPrefix = 'rl' } = options;
  const windowMs = windowSeconds * 1000;

  return createMiddleware<{ Bindings: Env; Variables: HonoVariables }>(async (c, next) => {
    // Em testes automatizados padrão, não aplica throttling a menos que ENVIRONMENT seja explicitamente staging/production
    if (c.env?.ENVIRONMENT === 'test' || (!c.env?.ENVIRONMENT && (process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined))) {
      await next();
      return;
    }

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    const now = Date.now();
    let count = 1;
    let resetAt = now + windowMs;

    // 1. Estratégia Distribuída Primária: Cloudflare KV (compartilhado globalmente)
    if (c.env?.RATE_LIMIT_KV) {
      const kvKey = `ratelimit:${keyPrefix}:${ip}`;
      try {
        const raw = await c.env.RATE_LIMIT_KV.get(kvKey, 'json') as RateLimitRecord | null;
        if (raw && raw.resetAt > now) {
          count = raw.count + 1;
          resetAt = raw.resetAt;
        } else {
          count = 1;
          resetAt = now + windowMs;
        }

        const ttlSeconds = Math.max(60, Math.ceil((resetAt - now) / 1000));
        await c.env.RATE_LIMIT_KV.put(
          kvKey,
          JSON.stringify({ count, resetAt }),
          { expirationTtl: ttlSeconds }
        );
      } catch (kvErr) {
        console.warn('[RATE_LIMIT_KV_FAILOVER]', kvErr);
      }
    } else {
      // 2. Estratégia Secundária Edge / Fallback
      const key = `${keyPrefix}:${ip}`;
      if (memoryStore.size > 10000) {
        cleanupMemoryStore();
      }

      let record = memoryStore.get(key);
      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + windowMs };
        memoryStore.set(key, record);
      } else {
        record.count += 1;
      }
      count = record.count;
      resetAt = record.resetAt;
    }

    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

    if (count > max) {
      const retryAfter = Math.ceil((resetAt - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      return c.json(
        {
          error: 'Muitas requisições. Por favor, aguarde alguns instantes antes de tentar novamente.',
          retryAfterSeconds: retryAfter,
        },
        429
      );
    }

    await next();
  });
}
