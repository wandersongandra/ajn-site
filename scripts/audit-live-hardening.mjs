import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const LEGACY_301_REDIRECTS = [
  { from: '/sitemap.xml', to: '/sitemap-index.xml' },
  { from: '/informacoes', to: '/mapa-site' },
  { from: '/empresa', to: '/sobre/' },
  { from: '/fale-conosco', to: '/contato/' },
  { from: '/projetos-eletricos-prediais', to: '/servicos' },
  { from: '/regularizacao-avcb', to: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/' },
];

const BLOCKED_PATHS = [
  '/.env',
  '/.git/config',
  '/evil.php',
  '/hostinger/bootstrap.php',
  '/005_security_hardening.sql',
  '/README.md',
  '/styles/',
];

function parseBaseUrl(argv = process.argv) {
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--url=')) {
      return arg.slice('--url='.length).trim();
    }
    if (!arg.startsWith('--')) {
      return arg.trim();
    }
  }
  return (process.env.LIVE_URL || process.env.BASE_URL || '').trim();
}

export async function runLiveHardeningAudit(rawBaseUrl) {
  if (!rawBaseUrl) {
    throw new Error('Uso: node scripts/audit-live-hardening.mjs --url=https://staging.ajnengenharia.com.br');
  }
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const origin = new URL(baseUrl).origin;
  const checks = [];
  const failures = [];

  const record = (name, ok, detail) => {
    checks.push({ name, ok, detail });
    if (!ok) {
      failures.push(`${name}: ${detail}`);
    }
  };

  // 1. /api/health = 200 + headers de segurança
  const healthRes = await fetch(`${baseUrl}/api/health`, { redirect: 'manual' });
  const healthText = await healthRes.text();
  let healthJson = null;
  try {
    healthJson = JSON.parse(healthText);
  } catch {
    healthJson = null;
  }
  record(
    'GET /api/health = 200',
    healthRes.status === 200 && healthJson?.status === 'ok',
    `status=${healthRes.status} body=${healthText.slice(0, 120)}`
  );

  const hsts = healthRes.headers.get('strict-transport-security') || '';
  const csp = healthRes.headers.get('content-security-policy') || '';
  const nosniff = healthRes.headers.get('x-content-type-options') || '';
  const coop = healthRes.headers.get('cross-origin-opener-policy') || '';
  const corp = healthRes.headers.get('cross-origin-resource-policy') || '';
  const referrer = healthRes.headers.get('referrer-policy') || '';
  const poweredBy = healthRes.headers.get('x-powered-by');

  record('Header Strict-Transport-Security', hsts.includes('max-age='), hsts || '(ausente)');
  record(
    'Header Content-Security-Policy (/api/health, sem unsafe-eval)',
    (csp.includes("default-src 'self'") || csp.includes("default-src 'none'")) && !csp.includes("'unsafe-eval'"),
    csp ? `${csp.slice(0, 80)}...` : '(ausente)'
  );
  record('Header X-Content-Type-Options = nosniff', nosniff.toLowerCase() === 'nosniff', nosniff || '(ausente)');
  record('Header Cross-Origin-Opener-Policy = same-origin', coop.toLowerCase() === 'same-origin', coop || '(ausente)');
  record('Header Cross-Origin-Resource-Policy = same-origin', corp.toLowerCase() === 'same-origin', corp || '(ausente)');
  record(
    'Header Referrer-Policy = strict-origin-when-cross-origin',
    referrer.toLowerCase() === 'strict-origin-when-cross-origin',
    referrer || '(ausente)'
  );
  record('Ausência de X-Powered-By', poweredBy === null, poweredBy ?? 'ausente');

  // 1b. Home HTML = 200 + CSP estrito sem unsafe-eval
  const homeRes = await fetch(`${baseUrl}/`, { redirect: 'manual' });
  const homeCsp = homeRes.headers.get('content-security-policy') || '';
  record(
    'GET / HTML = 200 e CSP default-src self sem unsafe-eval',
    homeRes.status === 200 && homeCsp.includes("default-src 'self'") && !homeCsp.includes("'unsafe-eval'"),
    `status=${homeRes.status} csp=${homeCsp ? homeCsp.slice(0, 80) : '(ausente)'}`
  );

  // 2. Arquivos sensíveis, .php fora de api/index.php e listagem de diretório = 403/404
  for (const path of BLOCKED_PATHS) {
    const res = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
    const body = await res.text();
    const statusOk = res.status === 403 || res.status === 404;
    const noDirIndex = !/Index of \//i.test(body);
    record(
      `Bloqueio de ${path} (403/404 e sem listagem)`,
      statusOk && noDirIndex,
      `status=${res.status}`
    );
  }

  // 3. Login com credencial inválida = 401 genérico
  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify({
      email: `auditoria-inexistente-${Date.now()}@ajnengenharia.com.br`,
      password: 'SenhaInvalidaAuditoria#2026',
    }),
    redirect: 'manual',
  });
  const loginBody = await loginRes.text();
  record(
    'POST /api/admin/auth/login inválido = 401 genérico',
    loginRes.status === 401 && loginBody === '{"error":"Credenciais inválidas."}',
    `status=${loginRes.status} body=${loginBody}`
  );

  // 4. Mutação sem CSRF / Origin inválido = 403
  const csrfRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://attacker.evil.example',
    },
    redirect: 'manual',
  });
  record(
    'Mutação administrativa sem CSRF / Origin cruzado = 403',
    csrfRes.status === 403,
    `status=${csrfRes.status}`
  );

  // 5. Redirects 301 legados no servidor real
  for (const rule of LEGACY_301_REDIRECTS) {
    const redirRes = await fetch(`${baseUrl}${rule.from}`, { redirect: 'manual' });
    const locationHeader = redirRes.headers.get('location') || '';
    let normalizedLocation = locationHeader;
    try {
      if (locationHeader.startsWith('http://') || locationHeader.startsWith('https://')) {
        normalizedLocation = new URL(locationHeader).pathname;
      }
    } catch {
      normalizedLocation = locationHeader;
    }
    const expectedNoSlash = rule.to.replace(/\/+$/, '');
    const actualNoSlash = normalizedLocation.replace(/\/+$/, '');
    const ok = redirRes.status === 301 && actualNoSlash === expectedNoSlash;
    record(
      `Redirect 301 legado ${rule.from} -> ${rule.to}`,
      ok,
      `status=${redirRes.status} location=${locationHeader || '(vazio)'}`
    );
  }

  return {
    ok: failures.length === 0,
    baseUrl,
    checks,
    failures,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const targetUrl = parseBaseUrl();
  try {
    const result = await runLiveHardeningAudit(targetUrl);
    for (const item of result.checks) {
      console.log(`[live-audit][${item.ok ? 'PASS' : 'FAIL'}] ${item.name} (${item.detail})`);
    }
    if (!result.ok) {
      console.error(`[live-audit] FALHOU em ${result.failures.length} verificações.`);
      process.exitCode = 1;
    } else {
      console.log(`[live-audit] PASS: ${result.checks.length}/${result.checks.length} controles verificados em ${result.baseUrl}.`);
    }
  } catch (err) {
    console.error(`[live-audit][ERROR] ${err.message}`);
    process.exitCode = 1;
  }
}
