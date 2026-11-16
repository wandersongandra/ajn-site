import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareHostingerDeploy } from './prepare-hostinger-deploy.mjs';

function createFixtureTree(
  root,
  {
    withTurnstile = false,
    siteKey = '0x4AAAAAAABkMYinukE_real_prod_key',
    forbiddenInDist = null,
    indexing = true,
    origin = 'https://ajnengenharia.com.br',
  } = {}
) {
  const robotsMeta = indexing ? 'index,follow' : 'noindex,nofollow,noarchive';
  const robotsTxt = indexing
    ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap-index.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  const htaccessContent = [
    'Options -Indexes',
    'Header always set Content-Security-Policy "default-src \'self\'; style-src \'self\'"',
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    '  RewriteCond %{DOCUMENT_ROOT}/../ajn-carreiras-private/maintenance.flag -f [OR]',
    '  RewriteCond %{DOCUMENT_ROOT}/../ajn-private/prod/maintenance.flag -f',
    '  RewriteRule ^(?:api|admin)(?:/.*)?$ api/index.php [QSA,L]',
    '</IfModule>',
    '',
  ].join('\n');

  const distFiles = {
    '.htaccess': htaccessContent,
    'index.html': `<!doctype html><html><head><meta name="robots" content="${robotsMeta}"><link rel="canonical" href="${origin}/"></head><body></body></html>`,
    'robots.txt': robotsTxt,
    'api/index.php': '<?php require dirname(__DIR__, 2) . "/ajn-carreiras-private/bootstrap.php";',
    'styles/global.css': 'body{}',
    'styles/carreiras.css': '.carreiras-page{}',
    'scripts/carreiras.js': '// ok',
    'scripts/admin-carreiras.js': '// ok',
    'carreiras/talentos/index.html': withTurnstile
      ? `<!doctype html><html><head><meta name="robots" content="${robotsMeta}"></head><body><form><div class="cf-turnstile" data-sitekey="${siteKey}"></div></form></body></html>`
      : `<!doctype html><html><head><meta name="robots" content="${robotsMeta}"></head><body><form><p>A verificação antispam será habilitada quando o ambiente for configurado.</p></form></body></html>`,
    'contato/index.html': `<!doctype html><html><head><meta name="robots" content="${robotsMeta}"></head><body><form data-contact-endpoint="https://api.opengscgandra.tech/contact"></form></body></html>`,
  };

  const publicHtaccessTarget = join(root, 'public', '.htaccess');
  mkdirSync(join(publicHtaccessTarget, '..'), { recursive: true });
  writeFileSync(publicHtaccessTarget, htaccessContent, 'utf8');

  for (const [rel, content] of Object.entries(distFiles)) {
    const target = join(root, 'dist', rel);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content, 'utf8');
  }
  if (forbiddenInDist) {
    const target = join(root, 'dist', forbiddenInDist);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, 'secret', 'utf8');
  }

  const hostingerFiles = [
    'admin.php',
    'app.php',
    'applications.php',
    'bootstrap.php',
    'lgpd.php',
    'migrate.php',
    'provision-user-mfa.php',
    'seed-admin.php',
    'verify-audit-chain.php',
    'purge-expired-data.php',
    'migrate-legacy-data.php',
    'unlock-admin.php',
    'send-security-alerts.php',
    'config.example.php',
    'resumes-directory.htaccess',
    'ops/env.sh',
    'ops/init-config.php',
    'ops/backup.sh',
    'ops/rollback.sh',
    'ops/check-layout.sh',
    'ops/check-public-diff.sh',
    'ops/run-cron.sh',
    'ops/seed-legacy-fixtures.php',
    'config.php',
    'tests/smoke.php',
    'migrations/001_initial.sql',
    'migrations/002_hardening.sql',
    'migrations/003_least_privilege.sql',
    'migrations/004_indexes.sql',
    'migrations/005_security_hardening.sql',
    'migrations/006_security_alerts_and_ip_locks.sql',
  ];
  for (const rel of hostingerFiles) {
    const target = join(root, 'hostinger', rel);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, `// ${rel}\n`, 'utf8');
  }
}

test('prepara pacote Hostinger separando public_html, ajn-carreiras-private sem config.php/tests e database', () => {
  const root = mkdtempSync(join(tmpdir(), 'ajn-deploy-pack-'));
  const validProdPrivate = '/home/u123456/ajn-private/prod';
  try {
    createFixtureTree(root, { withTurnstile: false });
    const summary = prepareHostingerDeploy({
      rootDir: root,
      requireTurnstile: false,
      prodPrivateDir: validProdPrivate,
    });

    assert.equal(summary.canonicalOrigin, 'https://ajnengenharia.com.br');
    assert.equal(summary.indexingAllowed, true);
    assert.equal(summary.contactEndpoint, 'https://api.opengscgandra.tech/contact');
    assert.equal(summary.turnstileEnabled, false);
    assert.equal(summary.prodPrivateDir, validProdPrivate);

    const prodHtaccessPath = join(summary.outputDir, 'public_html/.htaccess');
    assert.equal(existsSync(prodHtaccessPath), true);
    assert.equal(existsSync(join(summary.outputDir, 'public_html/api/index.php')), true);

    const prodHtaccess = readFileSync(prodHtaccessPath, 'utf8');
    const sourcePublicHtaccess = readFileSync(join(root, 'public/.htaccess'), 'utf8');
    const sourceDistHtaccess = readFileSync(join(root, 'dist/.htaccess'), 'utf8');
    assert.match(prodHtaccess, new RegExp(`SetEnv AJN_PRIVATE_DIR "${validProdPrivate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(prodHtaccess, new RegExp(`SetEnvIf Request_URI "\\^" AJN_PRIVATE_DIR=${validProdPrivate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(prodHtaccess, new RegExp(`RewriteCond "${validProdPrivate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/maintenance\\.flag" -f \\[OR\\]`));
    assert.equal(/SetEnv AJN_PRIVATE_DIR/.test(sourcePublicHtaccess), false);
    assert.equal(/SetEnv AJN_PRIVATE_DIR/.test(sourceDistHtaccess), false);
    assert.equal(new Set(summary.htaccessEntries.map((entry) => entry.cspSha256)).size, 1);

    // G.4: tests/, migrations/, CLI scripts e arquivos de configuração NUNCA entram em public_html
    for (const forbidden of [
      'tests',
      'migrations',
      'hostinger',
      'ops',
      'migrate.php',
      'seed-admin.php',
      'provision-user-mfa.php',
      'verify-audit-chain.php',
      'purge-expired-data.php',
      'migrate-legacy-data.php',
      'unlock-admin.php',
      'send-security-alerts.php',
      'config.php',
      'config.example.php',
      'bootstrap.php',
      'admin.php',
      'applications.php',
      'lgpd.php',
    ]) {
      assert.equal(
        existsSync(join(summary.outputDir, 'public_html', forbidden)),
        false,
        `${forbidden} jamais pode existir dentro de public_html`
      );
    }

    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/bootstrap.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/migrate.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/env.sh')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/init-config.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/backup.sh')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/rollback.sh')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/check-layout.sh')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/check-public-diff.sh')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/run-cron.sh')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ops/seed-legacy-fixtures.php')), false);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/ops')), false);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/verify-audit-chain.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/purge-expired-data.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/unlock-admin.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/send-security-alerts.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/resumes/.htaccess')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/config.example.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/config.php')), false);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/tests')), false);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/migrations')), false);
    assert.equal(existsSync(join(summary.outputDir, 'database/002_hardening.sql')), true);
    assert.equal(existsSync(join(summary.outputDir, 'database/004_indexes.sql')), true);
    assert.equal(existsSync(join(summary.outputDir, 'database/005_security_hardening.sql')), true);
    assert.equal(existsSync(join(summary.outputDir, 'database/006_security_alerts_and_ip_locks.sql')), true);

    const checklist = readFileSync(join(summary.outputDir, 'DEPLOY-CHECKLIST.md'), 'utf8');
    assert.match(checklist, /BLOQUEIO CRITICO/);
    assert.match(checklist, /PUBLIC_TURNSTILE_SITE_KEY/);
    assert.match(checklist, /005_security_hardening\.sql/);
    assert.match(checklist, /Backup cifrado/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('recusa empacotar quando conteúdo privado (config, tests, migrations, CLI) vaza para dist/ e reconhece Turnstile ativo', () => {
  const root = mkdtempSync(join(tmpdir(), 'ajn-deploy-turnstile-'));
  const validProdPrivate = '/home/u123456/ajn-private/prod';
  try {
    createFixtureTree(root, { withTurnstile: true });
    const summary = prepareHostingerDeploy({ rootDir: root, prodPrivateDir: validProdPrivate });
    assert.equal(summary.turnstileEnabled, true);
    const checklist = readFileSync(join(summary.outputDir, 'DEPLOY-CHECKLIST.md'), 'utf8');
    assert.doesNotMatch(checklist, /BLOQUEIO CRITICO/);

    for (const leaked of ['config.php', 'seed-admin.php', 'provision-user-mfa.php', 'tests', 'migrations']) {
      const target = join(root, 'dist', leaked);
      if (leaked.endsWith('.php')) {
        writeFileSync(target, '<?php return [];', 'utf8');
      } else {
        mkdirSync(target, { recursive: true });
      }
      assert.throws(() => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: validProdPrivate }), new RegExp(leaked.replace('.', '\\.')));
      rmSync(target, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('falha por padrão quando Indexação=false, Turnstile=false, sitekey é de teste ou PROD_PRIVATE_DIR inválido/ausente', () => {
  const root = mkdtempSync(join(tmpdir(), 'ajn-deploy-prod-guard-'));
  const validProdPrivate = '/home/u123456/ajn-private/prod';
  try {
    createFixtureTree(root, { withTurnstile: false });
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: validProdPrivate }),
      /Turnstile no HTML está em false/
    );

    for (const testSiteKey of ['1x00000000000000000000AA', '2x00000000000000000000AB', '3x00000000000000000000FF']) {
      createFixtureTree(root, { withTurnstile: true, siteKey: testSiteKey });
      assert.throws(
        () => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: validProdPrivate }),
        /chave de teste Turnstile/
      );
    }

    createFixtureTree(root, { withTurnstile: true, siteKey: '0x4AAAAAAABkMYinukE_real_prod_key' });
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: '' }),
      /PROD_PRIVATE_DIR é obrigatório/
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: '/home/u123456/public_html/ajn-private' }),
      /PROD_PRIVATE_DIR inseguro.*webroot público/
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: 'ajn-private/prod' }),
      /PROD_PRIVATE_DIR inválido/
    );

    writeFileSync(
      join(root, 'dist', 'index.html'),
      '<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://ajnengenharia.com.br/"></head><body></body></html>',
      'utf8'
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, prodPrivateDir: validProdPrivate }),
      /Indexação está em false/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('pack:hostinger:staging grava em output/hostinger-staging, rejeita origem prod, injeta Basic Auth apenas no staging e valida CSP', () => {
  const root = mkdtempSync(join(tmpdir(), 'ajn-deploy-staging-'));
  const stagingOrigin = 'https://staging.ajnengenharia.com.br';
  const validHtpasswd = '/home/u123456/domains/staging.ajnengenharia.com.br/.htpasswd-staging';
  const validStagingPrivate = '/home/u123456/ajn-private/staging';
  try {
    createFixtureTree(root, {
      withTurnstile: true,
      siteKey: '1x00000000000000000000AA',
      indexing: false,
      origin: stagingOrigin,
    });
    const stagingSummary = prepareHostingerDeploy({
      rootDir: root,
      mode: 'staging',
      stagingHtpasswdFile: validHtpasswd,
      stagingPrivateDir: validStagingPrivate,
    });
    assert.equal(stagingSummary.mode, 'staging');
    assert.equal(stagingSummary.canonicalOrigin, stagingOrigin);
    assert.equal(stagingSummary.indexingAllowed, false);
    assert.equal(stagingSummary.allPagesNoindex, true);
    assert.equal(stagingSummary.robotsDisallowAll, true);
    assert.equal(stagingSummary.outputDir, join(root, 'output', 'hostinger-staging'));
    const stagingHtaccessPath = join(root, 'output', 'hostinger-staging', 'public_html', '.htaccess');
    assert.equal(existsSync(stagingHtaccessPath), true);
    assert.equal(existsSync(join(root, 'output', 'hostinger-deploy')), false);
    assert.equal(existsSync(join(stagingSummary.outputDir, 'ops', 'seed-legacy-fixtures.php')), true);
    assert.equal(stagingSummary.htaccessEntries.length, 3);
    assert.equal(
      new Set(stagingSummary.htaccessEntries.map((entry) => entry.cspSha256)).size,
      1,
      'public/.htaccess, dist/.htaccess e output/hostinger-staging/public_html/.htaccess devem ter o mesmo SHA-256 CSP'
    );

    const stagingHtaccess = readFileSync(stagingHtaccessPath, 'utf8');
    const sharedPublicHtaccess = readFileSync(join(root, 'public', '.htaccess'), 'utf8');
    const sharedDistHtaccess = readFileSync(join(root, 'dist', '.htaccess'), 'utf8');
    assert.match(stagingHtaccess, /AuthType Basic/);
    assert.match(stagingHtaccess, new RegExp(validHtpasswd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(stagingHtaccess, new RegExp(validStagingPrivate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(/\bAuthType\b/i.test(sharedPublicHtaccess), false);
    assert.equal(/\bAuthType\b/i.test(sharedDistHtaccess), false);

    // 6.a: staging REJEITA canonical pointing to production hosts
    for (const prodOrigin of ['https://ajnengenharia.com.br', 'https://www.ajnengenharia.com.br']) {
      createFixtureTree(root, {
        withTurnstile: true,
        siteKey: '1x00000000000000000000AA',
        indexing: false,
        origin: prodOrigin,
      });
      assert.throws(
        () => prepareHostingerDeploy({ rootDir: root, mode: 'staging', stagingHtpasswdFile: validHtpasswd }),
        /domínio de produção/
      );
    }

    // 6.b: staging exige STAGING_HTPASSWD_FILE valido e fora de public_html
    createFixtureTree(root, {
      withTurnstile: true,
      siteKey: '1x00000000000000000000AA',
      indexing: false,
      origin: stagingOrigin,
    });
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, mode: 'staging', stagingHtpasswdFile: '' }),
      /STAGING_HTPASSWD_FILE/
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, mode: 'staging', stagingHtpasswdFile: '/home/u123/public_html/.htpasswd' }),
      /dentro de webroot público/
    );

    // Proibido gravar staging dentro da pasta de producao
    assert.throws(
      () => prepareHostingerDeploy({
        rootDir: root,
        mode: 'staging',
        outputDir: join(root, 'output', 'hostinger-deploy'),
        stagingHtpasswdFile: validHtpasswd,
      }),
      /não pode gravar na pasta de produção/
    );

    // Staging falha se alguma pagina HTML perder meta noindex
    writeFileSync(
      join(root, 'dist', 'contato', 'index.html'),
      '<!doctype html><html><head><meta name="robots" content="index,follow"></head><body></body></html>',
      'utf8'
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, mode: 'staging', stagingHtpasswdFile: validHtpasswd }),
      /páginas sem meta noindex: contato\/index\.html/
    );

    // Staging falha se indexacao estiver ativa (index,follow + Allow: /)
    createFixtureTree(root, {
      withTurnstile: true,
      siteKey: '1x00000000000000000000AA',
      indexing: true,
      origin: stagingOrigin,
    });
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, mode: 'staging', stagingHtpasswdFile: validHtpasswd }),
      /Indexação está em true/
    );

    // Producao falha se .htaccess tiver AuthType Basic/AuthUserFile
    createFixtureTree(root, {
      withTurnstile: true,
      siteKey: '0x4AAAAAAABkMYinukE_real_prod_key',
      indexing: true,
      origin: 'https://ajnengenharia.com.br',
    });
    writeFileSync(
      join(root, 'public', '.htaccess'),
      'Options -Indexes\nAuthType Basic\nAuthUserFile /home/u/.htpasswd\nHeader always set Content-Security-Policy "default-src \'self\'"\n',
      'utf8'
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, mode: 'production', prodPrivateDir: '/home/u123456/ajn-private/prod' }),
      /AuthType\/AuthUserFile/
    );

    // Staging + Producao falham se public/.htaccess divergir de dist/.htaccess
    createFixtureTree(root, {
      withTurnstile: true,
      siteKey: '1x00000000000000000000AA',
      indexing: false,
      origin: stagingOrigin,
    });
    writeFileSync(
      join(root, 'dist', '.htaccess'),
      'Options -Indexes\nHeader always set Content-Security-Policy "default-src \'none\'"\n',
      'utf8'
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, mode: 'staging', stagingHtpasswdFile: validHtpasswd }),
      /Divergência de CSP\/\.htaccess/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
