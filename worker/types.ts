/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  RESUMES_BUCKET: R2Bucket;
  ENVIRONMENT?: string;
  SESSION_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  CORS_ORIGIN?: string;
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
