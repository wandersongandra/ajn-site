import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';
import { rateLimiter } from './middleware/rate-limit';
import { generateRandomToken } from './lib/crypto';
import { createPublicJobsRoutes } from './routes/public-jobs';
import { createPublicApplicationsRoutes } from './routes/public-applications';
import { createPublicLgpdRoutes } from './routes/public-lgpd';
import { createAdminAuthRoutes } from './routes/admin-auth';
import { createAdminJobsRoutes } from './routes/admin-jobs';
import { createAdminCandidatesRoutes } from './routes/admin-candidates';
import { createAdminPipelineRoutes } from './routes/admin-pipeline';
import { createAdminLgpdRoutes } from './routes/admin-lgpd';
import { createAdminAuditRoutes } from './routes/admin-audit';
import type { Env, HonoVariables } from './types';

export function createCarreirasApp(customDbFactory?: (env: Env) => any) {
  const app = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  const dbFactory = customDbFactory || ((env: Env) => drizzle(env.DB, { schema }));

  // Middleware: Request ID e cabeçalhos de segurança HTTP
  app.use('*', async (c, next) => {
    const requestId = generateRandomToken(8);
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    await next();
  });

  // Middleware: CORS restrito exclusivamente a origens autorizadas (sem wildcards)
  app.use(
    '/api/*',
    cors({
      origin: (origin, c) => {
        const allowedOrigin = c.env?.CORS_ORIGIN || 'https://ajnengenharia.com.br';
        if (!origin) return allowedOrigin;

        const exactTrustedOrigins = new Set<string>([
          allowedOrigin,
          'https://ajnengenharia.com.br',
          'https://www.ajnengenharia.com.br',
          'https://carreiras.ajnengenharia.com.br',
          'https://sienna-mongoose-223157.hostingersite.com',
        ]);

        const isDevOrTest =
          c.env?.ENVIRONMENT === 'test' ||
          c.env?.ENVIRONMENT === 'development' ||
          process.env.NODE_ENV === 'test' ||
          process.env.VITEST !== undefined;

        if (isDevOrTest) {
          exactTrustedOrigins.add('http://127.0.0.1:4321');
          exactTrustedOrigins.add('http://localhost:4321');
        }

        if (exactTrustedOrigins.has(origin)) {
          return origin;
        }
        return null;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Content-Disposition'],
      credentials: true,
      maxAge: 86400,
    })
  );

  // Health check endpoint
  app.get('/api/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'ajn-carreiras-api',
      environment: c.env?.ENVIRONMENT || 'production',
      timestamp: new Date().toISOString(),
    });
  });

  // Rotas públicas com rate limiting
  app.use('/api/jobs/*', rateLimiter({ max: 120, windowSeconds: 60, keyPrefix: 'rl-jobs' }));
  app.route('/api/jobs', createPublicJobsRoutes(dbFactory));

  // Roteamento de páginas públicas de carreiras no Cloudflare Worker (SSR compatível)
  app.use('/carreiras/*', rateLimiter({ max: 120, windowSeconds: 60, keyPrefix: 'rl-carreiras-page' }));
  app.route('/carreiras', createPublicJobsRoutes(dbFactory));

  // Proteção contra abuso de envio de e-mails e recuperação (P1 Item 6)
  app.use(
    '/api/applications/request-verification',
    rateLimiter({ max: 3, windowSeconds: 900, keyPrefix: 'rl-app-req-verif' })
  );
  app.use(
    '/api/applications/recover-tracking',
    rateLimiter({ max: 3, windowSeconds: 900, keyPrefix: 'rl-app-rec-track' })
  );
  app.use('/api/applications/*', rateLimiter({ max: 20, windowSeconds: 600, keyPrefix: 'rl-app' }));
  app.route('/api/applications', createPublicApplicationsRoutes(dbFactory));

  app.use('/api/lgpd/*', rateLimiter({ max: 10, windowSeconds: 600, keyPrefix: 'rl-lgpd' }));
  app.route('/api/lgpd', createPublicLgpdRoutes(dbFactory));

  // Rotas administrativas com rate limiting específico para login e redefinição (P1 Item 6)
  app.use('/api/admin/auth/login', rateLimiter({ max: 10, windowSeconds: 900, keyPrefix: 'rl-login' }));
  app.use(
    '/api/admin/auth/forgot-password',
    rateLimiter({ max: 3, windowSeconds: 900, keyPrefix: 'rl-forgot-pw' })
  );
  app.use(
    '/api/admin/auth/reset-password',
    rateLimiter({ max: 5, windowSeconds: 900, keyPrefix: 'rl-reset-pw' })
  );
  app.route('/api/admin/auth', createAdminAuthRoutes(dbFactory));
  app.route('/api/admin/jobs', createAdminJobsRoutes(dbFactory));
  app.route('/api/admin/candidates', createAdminCandidatesRoutes(dbFactory));
  app.route('/api/admin/pipeline', createAdminPipelineRoutes(dbFactory));
  app.route('/api/admin/lgpd', createAdminLgpdRoutes(dbFactory));
  app.route('/api/admin/audit', createAdminAuditRoutes(dbFactory));

  // Tratamento seguro de rotas não encontradas
  app.notFound((c) => {
    return c.json({ error: 'Endpoint não encontrado.', status: 404, requestId: c.get('requestId') }, 404);
  });

  // Tratamento global de erros — impede vazamento de dados internos ou stack traces
  app.onError((err, c) => {
    const requestId = c.get('requestId') || 'unknown';
    console.error(`[WORKER_ERROR][${requestId}]`, err);
    return c.json(
      {
        error: 'Ocorreu um erro interno ao processar a solicitação.',
        requestId,
      },
      500
    );
  });

  return app;
}

export { RateLimiterDO } from './middleware/rate-limit';

// Handler padrão Cloudflare Worker
export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    const app = createCarreirasApp();
    return app.fetch(request, env, ctx);
  },
};
