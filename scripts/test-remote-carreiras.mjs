const remoteOrigin = (process.env.AJN_CARREIRAS_REMOTE_ORIGIN || '').trim().replace(/\/+$/, '');
const fullHomologationAuthorized = process.env.AJN_CARREIRAS_HOMOLOGATION_READY === 'true';

const blockedRequirements = [
  'AJN_CARREIRAS_REMOTE_ORIGIN=https://... (Worker ou Custom Domain de staging publicado)',
  'Recursos D1, R2, Durable Object/KV e Turnstile de staging provisionados',
  'Credenciais de homologação e mailbox controlado para MFA/recuperação de senha',
  'Arquivo PDF sintético aprovado para o teste de candidatura',
];

if (!remoteOrigin) {
  console.error(JSON.stringify({
    status: 'BLOCKED',
    scope: 'homologação remota',
    reason: 'Nenhum endpoint de staging foi fornecido; o teste não usa localhost nem fixtures.',
    required: blockedRequirements,
  }, null, 2));
  process.exit(2);
}

let origin;
try {
  origin = new URL(remoteOrigin);
  if (origin.protocol !== 'https:') throw new Error('HTTPS obrigatório');
} catch (error) {
  console.error(JSON.stringify({ status: 'FAIL', reason: `Endpoint remoto inválido: ${error.message}` }, null, 2));
  process.exit(1);
}

const checks = [];
async function check(path, expectedStatus, assertion) {
  const url = new URL(path, origin).href;
  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
    });
    const body = await response.text();
    const passed = response.status === expectedStatus && assertion(body, response);
    checks.push({ path, expectedStatus, actualStatus: response.status, status: passed ? 'PASS' : 'FAIL' });
    if (!passed) console.error(`[remote][FAIL] ${path}: HTTP ${response.status}`);
  } catch (error) {
    checks.push({ path, status: 'FAIL', error: error.message });
    console.error(`[remote][FAIL] ${path}: ${error.message}`);
  }
}

await check('/carreiras/', 200, (body) =>
  body.includes('<!DOCTYPE html>') &&
  body.includes('<link rel="canonical"') &&
  body.includes('/styles/carreiras.css')
);

for (const asset of ['/styles/global.css', '/styles/carreiras.css', '/scripts/carreiras.js']) {
  await check(asset, 200, (body, response) =>
    response.headers.get('content-type')?.includes(asset.endsWith('.js') ? 'javascript' : 'text') ?? body.length > 0
  );
}

await check('/carreiras/__ajn_remote_missing__/', 404, (body) =>
  body.includes('noindex') && !body.includes('"@type":"JobPosting"')
);

const failed = checks.filter((checkResult) => checkResult.status !== 'PASS');
const essentialFlowsBlocked = !fullHomologationAuthorized;
const overallStatus = failed.length > 0 ? 'FAIL' : essentialFlowsBlocked ? 'BLOCKED' : 'PASS';
console.log(JSON.stringify({
  status: overallStatus,
  scope: 'homologação remota pública sem JavaScript',
  origin: origin.origin,
  checks,
  blocked: essentialFlowsBlocked ? [
    'AJN_CARREIRAS_HOMOLOGATION_READY=true não foi fornecido',
    ...blockedRequirements,
  ] : [],
  note: 'Fluxos autenticados, D1/R2/DO, MFA, e-mail, Turnstile e LGPD exigem credenciais e recursos remotos controlados; este script não os simula.',
}, null, 2));

if (failed.length > 0) process.exit(1);
if (essentialFlowsBlocked) process.exit(2);
