import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { sha256, generateRandomToken } from '../lib/crypto';
import { lgpdDeletionSchema } from '../lib/validation';
import { verifyTurnstile } from '../lib/antispam';
import { logAuditEvent } from '../lib/audit';
import type { Env, HonoVariables } from '../types';

export function createPublicLgpdRoutes(dbFactory: (env: Env) => any) {
  const router = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

  // Solicitação de exclusão definitiva de dados pessoais (Art. 18 da LGPD)
  router.post('/deletion-request', async (c) => {
    return handleLgpdRequest(c, dbFactory, 'deletion');
  });

  // Solicitação de exportação/portabilidade de dados pessoais
  router.post('/export-request', async (c) => {
    return handleLgpdRequest(c, dbFactory, 'export');
  });

  return router;
}

async function handleLgpdRequest(c: any, dbFactory: (env: Env) => any, requestType: 'deletion' | 'export') {
  const db = dbFactory(c.env);
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';
  const userAgent = c.req.header('user-agent') || 'Unknown';

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Corpo da requisição deve ser JSON válido.' }, 400);
  }

  const validation = lgpdDeletionSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, 400);
  }
  const { email, cpf, reason, turnstileToken } = validation.data;

  // Verificação antispam
  const antispam = await verifyTurnstile(turnstileToken, c.env?.TURNSTILE_SECRET_KEY, ip);
  if (!antispam.success) {
    return c.json({ error: antispam.error }, 400);
  }

  const cpfClean = cpf.replace(/\D/g, '');
  const cpfHash = await sha256(cpfClean);

  // Localiza o titular pelo CPF hash e e-mail
  const candidate = await db
    .select()
    .from(schema.candidates)
    .where(and(eq(schema.candidates.cpfHash, cpfHash), eq(schema.candidates.email, email)))
    .get();

  if (!candidate) {
    // Por segurança e privacidade, não confirmamos se o titular existe ou não caso os dados divirjam
    return c.json({
      success: true,
      protocol: 'LGPD-' + new Date().getFullYear() + '-' + generateRandomToken(4).toUpperCase(),
      message: 'Se os dados corresponderem a um cadastro ativo em nossa base, sua solicitação foi registrada para processamento pelo encarregado de dados (DPO).',
    });
  }

  const requestId = 'lgpd-req-' + generateRandomToken(12);
  const protocol = 'LGPD-' + new Date().getFullYear() + '-' + generateRandomToken(4).toUpperCase();

  await db.insert(schema.dataSubjectRequests).values({
    id: requestId,
    candidateId: candidate.id,
    requestType,
    status: 'pending',
    reason: reason || null,
    requestedAt: new Date(),
  });

  await logAuditEvent({
    db,
    actorId: candidate.id,
    actorType: 'candidate',
    action: requestType === 'deletion' ? 'LGPD_DELETION_REQUESTED' : 'LGPD_EXPORT_REQUESTED',
    resource: 'lgpd',
    resourceId: requestId,
    details: { protocol, candidateId: candidate.id },
    ipAddress: ip,
    userAgent,
  });

  return c.json({
    success: true,
    protocol,
    message: requestType === 'deletion'
      ? 'Solicitação de exclusão de dados registrada com sucesso. O processo será revisado e efetivado conforme os prazos legais da LGPD.'
      : 'Solicitação de exportação de dados registrada com sucesso.',
  });
}
