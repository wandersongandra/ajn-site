import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareHostingerDeploy } from './prepare-hostinger-deploy.mjs';

function createFixtureTree(root, { withTurnstile = false, forbiddenInDist = null } = {}) {
  const distFiles = {
    '.htaccess': 'Options -Indexes\n',
    'index.html': '<!doctype html><html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://ajnengenharia.com.br/"></head><body></body></html>',
    'robots.txt': 'User-agent: *\nAllow: /\nSitemap: https://ajnengenharia.com.br/sitemap-index.xml\n',
    'api/index.php': '<?php require dirname(__DIR__, 2) . "/ajn-carreiras-private/bootstrap.php";',
    'styles/global.css': 'body{}',
    'styles/carreiras.css': '.carreiras-page{}',
    'scripts/carreiras.js': '// ok',
    'scripts/admin-carreiras.js': '// ok',
    'carreiras/talentos/index.html': withTurnstile
      ? '<form><div class="cf-turnstile" data-sitekey="pub-key"></div></form>'
      : '<form><p>A verificação antispam será habilitada quando o ambiente for configurado.</p></form>',
    'contato/index.html': '<form data-contact-endpoint="https://api.opengscgandra.tech/contact"></form>',
  };

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
    'provision-user-mfa.php',
    'seed-admin.php',
    'verify-audit-chain.php',
    'purge-expired-data.php',
    'migrate-legacy-data.php',
    'config.example.php',
    'resumes-directory.htaccess',
    'config.php',
    'tests/smoke.php',
    'migrations/001_initial.sql',
    'migrations/002_hardening.sql',
    'migrations/003_least_privilege.sql',
    'migrations/004_indexes.sql',
    'migrations/005_security_hardening.sql',
  ];
  for (const rel of hostingerFiles) {
    const target = join(root, 'hostinger', rel);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, `// ${rel}\n`, 'utf8');
  }
}

test('prepara pacote Hostinger separando public_html, ajn-carreiras-private sem config.php/tests e database', () => {
  const root = mkdtempSync(join(tmpdir(), 'ajn-deploy-pack-'));
  try {
    createFixtureTree(root, { withTurnstile: false });
    const summary = prepareHostingerDeploy({ rootDir: root });

    assert.equal(summary.canonicalOrigin, 'https://ajnengenharia.com.br');
    assert.equal(summary.indexingAllowed, true);
    assert.equal(summary.contactEndpoint, 'https://api.opengscgandra.tech/contact');
    assert.equal(summary.turnstileEnabled, false);

    assert.equal(existsSync(join(summary.outputDir, 'public_html/.htaccess')), true);
    assert.equal(existsSync(join(summary.outputDir, 'public_html/api/index.php')), true);

    // G.4: tests/, migrations/, CLI scripts e arquivos de configuração NUNCA entram em public_html
    for (const forbidden of [
      'tests',
      'migrations',
      'hostinger',
      'seed-admin.php',
      'provision-user-mfa.php',
      'verify-audit-chain.php',
      'purge-expired-data.php',
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
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/verify-audit-chain.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/purge-expired-data.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/resumes/.htaccess')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/config.example.php')), true);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/config.php')), false);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/tests')), false);
    assert.equal(existsSync(join(summary.outputDir, 'ajn-carreiras-private/migrations')), false);
    assert.equal(existsSync(join(summary.outputDir, 'database/002_hardening.sql')), true);
    assert.equal(existsSync(join(summary.outputDir, 'database/004_indexes.sql')), true);
    assert.equal(existsSync(join(summary.outputDir, 'database/005_security_hardening.sql')), true);

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
  try {
    createFixtureTree(root, { withTurnstile: true });
    const summary = prepareHostingerDeploy({ rootDir: root });
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
      assert.throws(() => prepareHostingerDeploy({ rootDir: root }), new RegExp(leaked.replace('.', '\\.')));
      rmSync(target, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('falha quando pacote de produção exige Indexação=true e Turnstile=true mas qualquer um dos dois está em false', () => {
  const root = mkdtempSync(join(tmpdir(), 'ajn-deploy-prod-guard-'));
  try {
    createFixtureTree(root, { withTurnstile: false });
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, requireIndexing: true, requireTurnstile: true }),
      /Turnstile no HTML está em false/
    );

    createFixtureTree(root, { withTurnstile: true });
    writeFileSync(
      join(root, 'dist', 'index.html'),
      '<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://ajnengenharia.com.br/"></head><body></body></html>',
      'utf8'
    );
    assert.throws(
      () => prepareHostingerDeploy({ rootDir: root, requireIndexing: true, requireTurnstile: true }),
      /Indexação está em false/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
