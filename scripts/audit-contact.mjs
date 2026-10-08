// A-001 / A-003: não simular captação de leads quando o provedor não existe.
import { readFile } from 'node:fs/promises';

const html = await readFile('dist/contato/index.html', 'utf8');
const footer = await readFile('dist/index.html', 'utf8');
const issues = [];
const configured = (process.env.PUBLIC_CONTACT_ENDPOINT || '').trim();
let enabled = false;
try {
  const url = new URL(configured);
  enabled = url.protocol === 'https:' && !url.username && !url.password;
} catch {
  // Endpoint ausente: renderização segura por canais diretos.
}
if (enabled) {
  if (!html.includes('data-contact-form')) issues.push('Formulário habilitado não foi renderizado.');
} else {
  if (html.includes('data-contact-form')) issues.push('Formulário sem endpoint continua captando dados.');
  if (!html.includes('Conversar pelo WhatsApp') || !html.includes('Enviar e-mail')) {
    issues.push('Canais de atendimento alternativos ausentes.');
  }
}
if (footer.includes('>Trabalhe Conosco</a>')) {
  issues.push('CTA de recrutamento ainda leva a canal comercial genérico.');
}
if (issues.length) {
  for (const issue of issues) console.error('[contact][FAIL]', issue);
  process.exitCode = 1;
} else {
  console.log('[contact] PASS: contato honesto e canal de recrutamento não anunciado indevidamente.');
}
