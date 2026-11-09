/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  RESUMES_BUCKET: R2Bucket;
  RATE_LIMIT_KV?: KVNamespace;
  RATE_LIMITER_DO?: DurableObjectNamespace;
  ENVIRONMENT?: string;
  SESSION_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  CORS_ORIGIN?: string;
  CORS_ORIGINS?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
  ASSETS?: Fetcher;
}

export type BaseDatabase = any;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'recruiter' | 'viewer';
  permissions: string[];
}

export interface HonoVariables {
  user?: AuthUser;
  requestId: string;
}
