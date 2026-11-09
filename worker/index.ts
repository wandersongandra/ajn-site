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
import { createAdminUsersRoutes } from './routes/admin-users';
import type { Env, HonoVariables } from './types';

const defaultProductionOrigins = [
  'https://ajnengenharia.com.br',
  'https://www.ajnengenharia.com.br',
  'https://carreiras.ajnengenharia.com.br',
];
const staticCareerAssetPaths = new Set(['/carreiras/talentos', '/carreiras/acompanhamento', '/carreiras/vaga']);

function getAllowedOrigins(env?: Env): Set<string> {
  const configured = (env?.CORS_ORIGINS || env?.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origins = new Set(configured.length > 0
    ? configured
    : !env || env?.ENVIRONMENT === 'production'
      ? defaultProductionOrigins
      : []);

  const isStrictEnvironment = env?.ENVIRONMENT === 'staging' || env?.ENVIRONMENT === 'production';
  const isDevOrTest = !isStrictEnvironment && (
    env?.ENVIRONMENT === 'test' ||
    env?.ENVIRONMENT === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST !== undefined
  );

  if (isDevOrTest) {
    origins.add('http://127.0.0.1:4321');
    origins.add('http://localhost:4321');
    origins.add('http://127.0.0.1:8787');
    origins.add('http://localhost:8787');
  }

  return origins;
}

function getAdminOrigin(request: Request, env?: Env): string | null {
  const configured = env?.APP_URL?.trim();
  if (!configured && env?.ENVIRONMENT === 'staging') {
    return new URL(request.url).origin;
  }

  if (!configured && env?.ENVIRONMENT !== 'production' && !isLocalTest(env)) return null;

  try {
    return new URL(configured || 'https://carreiras.ajnengenharia.com.br').origin;
  } catch {
    return null;
  }
}

function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin')?.trim();
  if (origin) return origin;

  const referer = request.headers.get('Referer')?.trim();
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isLocalTest(env?: Env): boolean {
  if (env?.ENVIRONMENT === 'staging' || env?.ENVIRONMENT === 'production') return false;
  return !env || env.ENVIRONMENT === 'test' || env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined;
}

function setSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; media-src 'self'; worker-src 'self'; manifest-src 'self'"
  );
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(), microphone=(), payment=(), usb=()');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function isDynamicCareerPath(pathname: string): boolean {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (!normalizedPath.startsWith('/carreiras/')) return false;

  return !staticCareerAssetPaths.has(normalizedPath);
}

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
    c.header('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; media-src 'self'; worker-src 'self'; manifest-src 'self'");
    c.header('Permissions-Policy', 'accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), geolocation=(), microphone=(), payment=(), usb=()');
    await next();
  });

  // Middleware: CORS restrito exclusivamente a origens autorizadas (sem wildcards)
  app.use(
    '/api/*',
    cors({
      origin: (origin, c) => {
        if (!origin) return undefined;
        if (c.env?.ENVIRONMENT === 'staging' && origin === new URL(c.req.url).origin) return origin;
        return getAllowedOrigins(c.env).has(origin) ? origin : undefined;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Content-Disposition'],
      credentials: true,
      maxAge: 86400,
    })
  );

  // Operações administrativas com cookie exigem prova de origem no navegador.
  // O bypass existe apenas para fixtures Vitest, nunca para staging/produção.
  app.use('/api/admin/*', async (c, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      await next();
      return;
    }

    const requestOrigin = getRequestOrigin(c.req.raw);
    const adminOrigin = getAdminOrigin(c.req.raw, c.env);
    if (!isLocalTest(c.env) && (!requestOrigin || !adminOrigin || requestOrigin !== adminOrigin)) {
      return c.json({ error: 'Origem não autorizada.' }, 403);
    }

    await next();
  });

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
  app.route('/api/admin/users', createAdminUsersRoutes(dbFactory));

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
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const app = createCarreirasApp();
    const response = await app.fetch(request, env, ctx);
    const pathname = new URL(request.url).pathname;
    if (response.status !== 404 || !env.ASSETS || pathname.startsWith('/api/') || pathname === '/api' || isDynamicCareerPath(pathname) || pathname === '/carreiras') {
      return response;
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return setSecurityHeaders(assetResponse);
  },
};
