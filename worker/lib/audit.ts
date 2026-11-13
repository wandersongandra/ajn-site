import * as schema from '../db/schema';
import { generateRandomToken } from './crypto';

export interface AuditEventParams {
  db: any;
  actorId?: string;
  actorType: 'admin' | 'candidate' | 'system' | 'anonymous';
  action: string;
  resource: 'auth' | 'job' | 'candidate' | 'resume' | 'application' | 'lgpd' | 'system';
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const id = 'audit-' + generateRandomToken(12);
    await params.db.insert(schema.auditLogs).values({
      id,
      actorId: params.actorId || null,
      actorType: params.actorType,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || null,
      detailsJson: params.details ? JSON.stringify(params.details) : null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      timestamp: new Date(),
    });
  } catch (err) {
    // Falhas de auditoria não devem quebrar a requisição principal silenciosamente, mas devem ser registradas
    console.error('[AUDIT_ERROR] Falha ao registrar log de auditoria:', err);
  }
}
