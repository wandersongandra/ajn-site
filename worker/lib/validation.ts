import { z } from 'zod';
import { isValidCpf } from './crypto';

export const candidateSchema = z.object({
  fullName: z.string().trim().min(3, 'Nome deve conter no mínimo 3 caracteres').max(120, 'Nome muito longo'),
  email: z.string().trim().email('E-mail inválido').max(150),
  phone: z.string().trim().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone deve estar no formato (DD) 99999-9999'),
  cpf: z.string().trim().refine((val) => isValidCpf(val), { message: 'CPF inválido' }),
  city: z.string().trim().min(2, 'Cidade inválida').max(100),
  state: z.string().trim().length(2, 'Estado deve conter 2 letras (ex: MG)').toUpperCase(),
  linkedinUrl: z.string().trim().url('URL do LinkedIn inválida').optional().or(z.literal('')),
  portfolioUrl: z.string().trim().url('URL do portfólio inválida').optional().or(z.literal('')),
  currentTitle: z.string().trim().max(100).optional().or(z.literal('')),
  summary: z.string().trim().max(1500, 'Resumo profissional deve ter no máximo 1500 caracteres').optional().or(z.literal('')),
  certifications: z.array(z.string().trim()).optional().default([]),
  consentTerms: z.literal(true, {
    message: 'É obrigatório aceitar o termo de consentimento e privacidade da AJN',
  }),
  consentRetention: z.boolean({
    error: 'A manifestação sobre retenção no banco de talentos deve ser explicitamente informada (sim ou não)',
  }),
  verificationToken: z.string().trim().optional(),
  turnstileToken: z.string().optional(),
});

export const resumeFileValidation = {
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  allowedMimes: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  allowedExtensions: new Set(['pdf', 'doc', 'docx']),
};

export function validateResumeBuffer(filename: string, mime: string, buffer: Uint8Array): { valid: boolean; error?: string } {
  if (buffer.length > resumeFileValidation.maxSizeBytes) {
    return { valid: false, error: 'O arquivo excede o limite máximo permitido de 5 MB.' };
  }
  if (buffer.length < 16) {
    return { valid: false, error: 'Arquivo vazio ou corrompido.' };
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !resumeFileValidation.allowedExtensions.has(ext)) {
    return { valid: false, error: 'Extensão de arquivo não permitida. Envie apenas PDF, DOC ou DOCX.' };
  }

  // Verificação de Magic Bytes para impedir uploads executáveis maliciosos
  if (ext === 'pdf') {
    // PDF deve iniciar com '%PDF-' (0x25, 0x50, 0x44, 0x46)
    if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return { valid: false, error: 'Assinatura binária inválida para arquivo PDF.' };
    }
  } else if (ext === 'docx') {
    // DOCX é um ZIP binário iniciando com 'PK\x03\x04' (0x50, 0x4B, 0x03, 0x04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return { valid: false, error: 'Assinatura binária inválida para arquivo DOCX.' };
    }
  } else if (ext === 'doc') {
    // DOC legado OLE2 (0xD0, 0xCF, 0x11, 0xE0)
    if (buffer[0] !== 0xd0 || buffer[1] !== 0xcf || buffer[2] !== 0x11 || buffer[3] !== 0xe0) {
      return { valid: false, error: 'Assinatura binária inválida para arquivo DOC.' };
    }
  }

  return { valid: true };
}

export const jobPostingSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z.string().trim().min(3).max(150).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  department: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  employmentType: z.enum(['CLT', 'PJ', 'Estágio', 'Temporário']),
  experienceLevel: z.enum(['Júnior', 'Pleno', 'Sênior', 'Especialista']),
  description: z.string().trim().min(20, 'Descrição deve ser detalhada'),
  requirements: z.union([z.string(), z.array(z.string())]),
  differentials: z.string().trim().optional(),
  benefits: z.string().trim().optional(),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  salaryIsDisclosed: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published', 'paused', 'closed', 'archived']).default('published'),
  openingsCount: z.number().int().min(1).default(1),
});

export const moveStageSchema = z.object({
  applicationId: z.string().min(1),
  targetStageId: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  mfaCode: z.string().trim().optional(),
});

export const lgpdDeletionSchema = z.object({
  email: z.string().trim().email(),
  cpf: z.string().trim().refine((val) => isValidCpf(val), { message: 'CPF inválido' }),
  reason: z.string().trim().max(500).optional(),
  turnstileToken: z.string().optional(),
});

export const recoverTrackingSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  cpf: z.string().trim().refine((val) => isValidCpf(val), { message: 'CPF inválido' }),
  turnstileToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('E-mail institucional inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(16, 'Token de recuperação inválido'),
  newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres'),
});

export const verifyRecoverySchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  code: z.string().trim().min(6, 'Código de verificação deve conter 6 dígitos').max(6),
});

export const mfaActivateSchema = z
  .object({
    code: z.string().trim().min(6, 'Código MFA deve ter 6 dígitos').max(6).optional(),
    totpCode: z.string().trim().min(6, 'Código MFA deve ter 6 dígitos').max(6).optional(),
  })
  .refine((data) => data.code || data.totpCode, { message: 'Código MFA de 6 dígitos é obrigatório' })
  .transform((data) => ({ code: (data.code || data.totpCode)! }));

export const requestVerificationSchema = z.object({
  cpf: z.string().trim().refine((val) => isValidCpf(val), { message: 'CPF inválido' }),
  turnstileToken: z.string().optional(),
});
