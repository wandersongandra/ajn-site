import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const gates = {
  A: [
    ['a.endpoint_https', 'Endpoint HTTPS de staging'],
    ['a.worker_health', 'Worker publicado e health check em staging'],
    ['a.public_ssr', 'SSR público com HTML e canonical'],
    ['a.public_assets', 'Assets indispensáveis publicados'],
    ['a.public_404', 'Vaga inexistente retorna 404/noindex'],
    ['a.d1_binding', 'D1 real persistente'],
    ['a.r2_private', 'R2 privado real'],
    ['a.durable_object_rate_limit', 'Durable Object de rate limiting'],
    ['a.turnstile', 'Turnstile real'],
    ['a.email_provider', 'Provedor de e-mail real'],
  ],
  B: [
    ['b.admin_mfa', 'Login administrativo com MFA'],
    ['b.secure_cookie', 'Cookie HttpOnly/Secure/SameSite'],
    ['b.refresh', 'Refresh do painel restaura sessão'],
    ['b.logout', 'Logout revoga sessão'],
    ['b.session_expiration', 'Expiração de sessão'],
    ['b.rbac', 'RBAC administrativo'],
    ['b.csrf', 'CSRF/origem'],
  ],
  C: [
    ['c.job_lifecycle', 'Ciclo de vida da vaga'],
    ['c.public_status', 'Status público da vaga'],
    ['c.application_pdf', 'Candidatura com PDF'],
    ['c.d1_persistence', 'Persistência D1 da candidatura'],
    ['c.candidate_tracking', 'Acompanhamento do candidato'],
  ],
  D: [
    ['d.password_recovery', 'Recuperação de senha por e-mail'],
    ['d.turnstile_valid_invalid', 'Turnstile válido e inválido'],
    ['d.rate_limit', 'Rate limiting efetivo'],
    ['d.lgpd_deletion', 'Exercício de exclusão LGPD'],
    ['d.audit', 'Logs de auditoria'],
    ['d.unauthorized_access', 'Acessos não autorizados rejeitados'],
  ],
};

const allChecks = Object.entries(gates).flatMap(([gate, entries]) => entries.map(([id, label]) => ({ id, gate, label })));
const publicChecks = new Set(['a.endpoint_https', 'a.worker_health', 'a.public_ssr', 'a.public_assets', 'a.public_404']);
const allowedEvidenceSources = new Set(['remote-http', 'remote-browser', 'remote-cli']);
const checks = new Map(allChecks.map((check) => [check.id, { ...check, status: 'BLOCKED', executed: false, source: null, evidence: null }]));

function setCheck(id, status, details = {}) {
  const current = checks.get(id);
  if (!current) return;
  checks.set(id, { ...current, status, ...details, executed: status === 'PASS' || details.executed === true });
}

function normalizeOrigin(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('HTTPS obrigatório');
  if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('A origem deve conter somente esquema, host e porta.');
  }
  if (['ajnengenharia.com.br', 'www.ajnengenharia.com.br', 'carreiras.ajnengenharia.com.br'].includes(parsed.hostname)) {
    throw new Error('O gate remoto não pode executar testes contra produção.');
  }
  return parsed.origin;
}

function requiredReportRequirements() {
  return [
    'AJN_CARREIRAS_REMOTE_ORIGIN ou AJN_CARREIRAS_STAGING_ORIGIN apontando para staging real',
    'Worker, D1, R2, Durable Object, Turnstile e provedor de e-mail provisionados no ambiente de staging',
    'Credencial administrativa sintética com MFA e mailbox controlado',
    'PDF sintético e autorização para criar/remover dados de homologação',
    'Manifesto de evidências remotas para os fluxos autenticados, sem mocks ou fixtures',
  ];
}

async function fetchRemote(path, headers = {}) {
  const url = new URL(path, remoteOrigin).href;
  const response = await fetch(url, { headers, redirect: 'manual' });
  const body = await response.text();
  return { response, body };
}

async function checkHttp(id, path, expectedStatus, assertion, evidenceLabel) {
  try {
    const { response, body } = await fetchRemote(path, { Accept: 'text/html, application/json' });
    const passed = response.status === expectedStatus && assertion(body, response);
    setCheck(id, passed ? 'PASS' : 'FAIL', {
      executed: true,
      source: 'remote-http',
      evidence: `${path}: HTTP ${response.status}; ${evidenceLabel}`,
      actualStatus: response.status,
      expectedStatus,
    });
  } catch (error) {
    setCheck(id, 'FAIL', { executed: true, source: 'remote-http', evidence: `${path}: ${error instanceof Error ? error.message : String(error)}` });
  }
}

async function loadEvidenceManifest() {
  const file = (process.env.AJN_CARREIRAS_REMOTE_EVIDENCE_FILE || '').trim();
  if (!file) return { status: 'NONE' };
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (parsed.environment !== 'staging' || parsed.origin !== remoteOrigin || !parsed.checks || typeof parsed.checks !== 'object') {
      throw new Error('environment, origin ou checks inválidos.');
    }
    for (const [id, evidence] of Object.entries(parsed.checks)) {
      if (!checks.has(id) || publicChecks.has(id)) throw new Error(`check não permitido no manifesto: ${id}`);
      if (!evidence || evidence.status !== 'PASS' || evidence.executed !== true || !allowedEvidenceSources.has(evidence.source) || typeof evidence.evidence !== 'string' || !evidence.evidence.trim()) {
        throw new Error(`evidência incompleta para ${id}`);
      }
      setCheck(id, 'PASS', { executed: true, source: evidence.source, evidence: evidence.evidence });
    }
    return { status: 'PASS', file };
  } catch (error) {
    return { status: 'FAIL', file, reason: error instanceof Error ? error.message : String(error) };
  }
}

const rawOrigin = (process.env.AJN_CARREIRAS_REMOTE_ORIGIN || process.env.AJN_CARREIRAS_STAGING_ORIGIN || '').trim();
let remoteOrigin = null;
let originError = null;
if (rawOrigin) {
  try {
    remoteOrigin = normalizeOrigin(rawOrigin);
  } catch (error) {
    originError = error instanceof Error ? error.message : String(error);
  }
}

if (!rawOrigin) {
  console.log(JSON.stringify({
    status: 'BLOCKED',
    gates: Object.fromEntries(Object.keys(gates).map((gate) => [gate, 'BLOCKED'])),
    checks: [...checks.values()],
    blocked: requiredReportRequirements(),
    evidence: { executed: false, source: null },
  }, null, 2));
  process.exit(2);
}

if (originError) {
  setCheck('a.endpoint_https', 'FAIL', { executed: true, source: 'remote-cli', evidence: originError });
} else {
  setCheck('a.endpoint_https', 'PASS', { executed: true, source: 'remote-cli', evidence: `Origem validada: ${remoteOrigin}` });
  await checkHttp('a.worker_health', '/api/health', 200, (body) => {
    try {
      const health = JSON.parse(body);
      return health.status === 'ok' && health.environment === 'staging';
    } catch {
      return false;
    }
  }, 'JSON status=ok e environment=staging');
  await checkHttp('a.public_ssr', '/carreiras/', 200, (body) => body.includes('<!DOCTYPE html>') && body.includes('<link rel="canonical"') && body.includes('/styles/carreiras.css'), 'HTML SSR, canonical e CSS');
  let assetsPassed = true;
  for (const asset of ['/styles/global.css', '/styles/carreiras.css', '/scripts/carreiras.js']) {
    try {
      const { response, body } = await fetchRemote(asset, { Accept: 'text/css, application/javascript' });
      const contentType = response.headers.get('content-type') || '';
      const expectedType = asset.endsWith('.js') ? 'javascript' : 'text/css';
      if (response.status !== 200 || (!contentType.includes(expectedType) && body.length === 0)) throw new Error(`${asset}: HTTP ${response.status}, content-type=${contentType}`);
    } catch (error) {
      assetsPassed = false;
      setCheck('a.public_assets', 'FAIL', { executed: true, source: 'remote-http', evidence: error instanceof Error ? error.message : String(error) });
      break;
    }
  }
  if (assetsPassed) setCheck('a.public_assets', 'PASS', { executed: true, source: 'remote-http', evidence: 'global.css, carreiras.css e carreiras.js retornaram HTTP 200.' });
  await checkHttp('a.public_404', '/carreiras/__ajn_remote_missing__/', 404, (body, response) => response.headers.get('x-robots-tag')?.includes('noindex') === true && !body.includes('"@type":"JobPosting"'), '404, X-Robots-Tag noindex e sem JobPosting');
}

const manifest = remoteOrigin ? await loadEvidenceManifest() : { status: 'NONE' };
if (manifest.status === 'FAIL') {
  setCheck('a.endpoint_https', 'FAIL', { executed: true, source: 'remote-cli', evidence: `Manifesto inválido: ${manifest.reason}` });
}

const resultChecks = [...checks.values()];
const failed = resultChecks.filter((check) => check.status === 'FAIL');
const blocked = resultChecks.filter((check) => check.status === 'BLOCKED');
const status = failed.length > 0 ? 'FAIL' : blocked.length > 0 ? 'BLOCKED' : 'PASS';
const report = {
  status,
  scope: 'homologação remota AJN Carreiras — Gates A-D',
  origin: remoteOrigin,
  gates: Object.fromEntries(Object.keys(gates).map((gate) => {
    const gateChecks = resultChecks.filter((check) => check.gate === gate);
    return [gate, gateChecks.some((check) => check.status === 'FAIL') ? 'FAIL' : gateChecks.some((check) => check.status === 'BLOCKED') ? 'BLOCKED' : 'PASS'];
  })),
  checks: resultChecks,
  manifest,
  blocked: blocked.map((check) => `${check.id}: ${check.label}`),
  note: 'PASS exige execução remota comprovada de todos os checks obrigatórios; variáveis de ambiente não substituem evidência.',
};
console.log(JSON.stringify(report, null, 2));
if (process.env.AJN_CARREIRAS_REMOTE_REPORT_FILE) {
  await writeFile(process.env.AJN_CARREIRAS_REMOTE_REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
process.exit(status === 'PASS' ? 0 : status === 'BLOCKED' ? 2 : 1);
