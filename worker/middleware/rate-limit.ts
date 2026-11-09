import { createMiddleware } from 'hono/factory';
import type { Env, HonoVariables } from '../types';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Limpeza periódica de memória para prevenir memory leak
function cleanupStore() {
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
    // Em ambiente de testes automatizados, ignora o rate limit
    if (process.env.NODE_ENV === 'test' || c.env?.ENVIRONMENT === 'test') {
      await next();
      return;
    }

    // Obtenção confiável do IP do cliente via cabeçalhos Cloudflare ou socket
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    if (memoryStore.size > 10000) {
      cleanupStore();
    }

    let record = memoryStore.get(key);
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      memoryStore.set(key, record);
    } else {
      record.count += 1;
    }

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

    await next();
  });
}
