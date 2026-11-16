import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyHtaccessCspSync } from './sync-csp-style-hashes.mjs';

const PRIVATE_RUNTIME_FILES = [
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
];

const OPS_SHARED_FILES = [
  'env.sh',
  'init-config.php',
  'check-layout.sh',
  'backup.sh',
  'rollback.sh',
  'check-public-diff.sh',
  'run-cron.sh',
];

const OPS_STAGING_ONLY_FILES = [
  'seed-legacy-fixtures.php',
];

const MIGRATION_FILES = [
  '001_initial.sql',
  '002_hardening.sql',
  '003_least_privilege.sql',
  '004_indexes.sql',
  '005_security_hardening.sql',
  '006_security_alerts_and_ip_locks.sql',
];

const PRODUCTION_HOSTS = new Set([
  'ajnengenharia.com.br',
  'www.ajnengenharia.com.br',
]);

const FORBIDDEN_IN_PUBLIC_HTML = [
  'config.php',
  'config.example.php',
  'hostinger',
  'migrations',
  'ops',
  'tests',
  'migrate.php',
  'seed-admin.php',
  'seed-legacy-fixtures.php',
  'init-config.php',
  'provision-user-mfa.php',
  'verify-audit-chain.php',
  'purge-expired-data.php',
  'migrate-legacy-data.php',
  'unlock-admin.php',
  'send-security-alerts.php',
  'backup.sh',
  'rollback.sh',
  'check-layout.sh',
  'check-public-diff.sh',
  'run-cron.sh',
  'bootstrap.php',
  'admin.php',
  'applications.php',
  'lgpd.php',
];

const REQUIRED_DIST_FILES = [
  '.htaccess',
  'index.html',
  'robots.txt',
  'api/index.php',
  'styles/global.css',
  'styles/carreiras.css',
  'scripts/carreiras.js',
  'scripts/admin-carreiras.js',
  'carreiras/talentos/index.html',
  'contato/index.html',
];

function assertRequiredFiles(baseDir, relativePaths, label) {
  for (const rel of relativePaths) {
    const full = join(baseDir, rel);
    if (!existsSync(full)) {
      throw new Error(`Arquivo obrigatório ausente em ${label}: ${rel}`);
    }
  }
}

function collectHtmlFiles(baseDir, currentDir = baseDir) {
  const files = [];
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const full = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(baseDir, full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push({
        relPath: relative(baseDir, full).replace(/\\/g, '/'),
        fullPath: full,
      });
    }
  }
  return files.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

export function inspectDistBuild(distDir) {
  assertRequiredFiles(distDir, REQUIRED_DIST_FILES, 'dist');

  const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
  const contactHtml = readFileSync(join(distDir, 'contato/index.html'), 'utf8');
  const talentHtml = readFileSync(join(distDir, 'carreiras/talentos/index.html'), 'utf8');
  const robotsTxt = readFileSync(join(distDir, 'robots.txt'), 'utf8');

  const canonicalMatch = homeHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const canonicalUrl = canonicalMatch?.[1] ?? '';
  const canonicalOrigin = canonicalUrl ? canonicalUrl.replace(/\/+$/, '') : '';

  const htmlFiles = collectHtmlFiles(distDir);
  const pagesWithoutNoindex = htmlFiles
    .filter(({ fullPath }) => {
      const html = readFileSync(fullPath, 'utf8');
      return !/<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html);
    })
    .map(({ relPath }) => relPath);

  const robotsDisallowAll = /^\s*Disallow:\s*\/\s*$/m.test(robotsTxt) && !/^\s*Allow:\s*\//m.test(robotsTxt);
  const allPagesNoindex = htmlFiles.length > 0 && pagesWithoutNoindex.length === 0;
  const indexingAllowed = /<meta\s+name="robots"\s+content="index,follow/i.test(homeHtml)
    && !robotsDisallowAll;

  const contactMatch = contactHtml.match(/data-contact-endpoint="([^"]*)"/i);
  const contactEndpoint = contactMatch?.[1] ?? '';
  const hasTurnstileWidget = /class="cf-turnstile"/i.test(talentHtml);
  const siteKeyMatch = talentHtml.match(
    /class="cf-turnstile"[^>]*data-sitekey="([^"]*)"|data-sitekey="([^"]*)"[^>]*class="cf-turnstile"/i
  );
  const turnstileSiteKey = (siteKeyMatch?.[1] ?? siteKeyMatch?.[2] ?? '').trim();
  const isTurnstileTestKey = /^(1x|2x|3x)/i.test(turnstileSiteKey);
  const hasTurnstileSiteKey = hasTurnstileWidget && Boolean(turnstileSiteKey);
  const turnstileEnabled = hasTurnstileSiteKey && !isTurnstileTestKey;

  return {
    canonicalOrigin,
    indexingAllowed,
    robotsDisallowAll,
    allPagesNoindex,
    htmlFileCount: htmlFiles.length,
    pagesWithoutNoindex,
    contactEndpoint,
    hasTurnstileSiteKey,
    turnstileEnabled,
    turnstileSiteKey,
    isTurnstileTestKey,
  };
}

function buildChecklistMarkdown(summary) {
  const blockers = [];
  if (!summary.turnstileEnabled) {
    blockers.push(
      '- **BLOQUEIO CRITICO — Turnstile ausente no HTML:** o build atual foi gerado sem `PUBLIC_TURNSTILE_SITE_KEY`. Candidaturas, acompanhamento, recuperação de código e solicitações LGPD falharão até rebuildar com `PUBLIC_TURNSTILE_SITE_KEY` e rodar `npm run pack:hostinger` novamente.'
    );
  }
  if (!summary.indexingAllowed) {
    blockers.push(
      '- **Aviso de indexação:** build configurado com `noindex` / `Disallow: /` (adequado para **staging**, **não** publicar assim em produção).'
    );
  }
  if (!summary.contactEndpoint) {
    blockers.push('- **Aviso de contato:** `PUBLIC_CONTACT_ENDPOINT` vazio no HTML de `/contato/`.');
  }

  const turnstileChecklistStatus = summary.turnstileEnabled
    ? 'ATIVO (`.cf-turnstile` com sitekey de produção)'
    : summary.mode === 'staging' && summary.hasTurnstileSiteKey
      ? 'STAGING (`.cf-turnstile` com chave de teste Cloudflare)'
      : 'AUSENTE — REBUILD NECESSARIO';

  return `# Pacote de Deploy Hostinger (${summary.mode.toUpperCase()}) — AJN Consultoria e Engenharia

Gerado em: ${summary.generatedAt}
Modo do pacote: ${summary.mode}
Origem compilada (\`PUBLIC_SITE_ORIGIN\`): ${summary.canonicalOrigin || '(não detectada)'}
Indexação permitida: ${summary.indexingAllowed ? 'SIM (`index,follow`)' : `NAO (\`noindex\` em ${summary.htmlFileCount}/${summary.htmlFileCount} páginas / staging)`}
Endpoint de contato: ${summary.contactEndpoint || '(desativado)'}
Turnstile no HTML (\`PUBLIC_TURNSTILE_SITE_KEY\`): ${turnstileChecklistStatus}
SHA-256 CSP (\`.htaccess\`): \`${summary.htaccessCspSha256 || 'n/a'}\`

${blockers.length ? `## Alertas deste pacote\n\n${blockers.join('\n')}\n` : '## Status do pacote\n\nBuild coerente para publicação após configurar `config.php`, banco e MFA no servidor.\n'}
## 1. Estrutura gerada

- \`public_html/\` (${summary.publicFileCount} arquivos): enviar para a raiz web \`public_html/\` do domínio na Hostinger (inclui \`.htaccess\`, \`.well-known/security.txt\` e \`api/index.php\`).
- \`ajn-carreiras-private/\` (${summary.privateFileCount} arquivos): enviar para **fora** de todas as raizes web (ex.: \`$HOME/ajn-private/staging\` ou \`$HOME/ajn-private/prod\`). **Nunca colocar dentro de \`public_html/\`.**
- \`database/\` (${summary.migrationCount} migrations SQL) e \`ajn-carreiras-private/migrate.php\`: aplicar no banco MySQL/MariaDB dedicado usando \`php migrate.php\` (ou \`php migrate.php --baseline=004\` em banco existente). **Não enviar para \`public_html/\`.**

## 2. Banco de dados e menor privilégio (usuário de migration vs runtime)

1. Crie um banco MySQL/MariaDB exclusivo para carreiras e **dois usuários distintos** no hPanel (ou via DBA):
   - \`u000_ajn_migrator\`: usado apenas para aplicar migrations (\`SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP\`, nunca em \`config.php\`).
   - \`u000_ajn_app_rw\`: usuário de runtime em \`config.php\`, restrito exclusivamente a \`SELECT, INSERT, UPDATE, DELETE\` nas tabelas do sistema (configurar privilégios no hPanel; \`migrate.php\` valida \`SHOW GRANTS FOR CURRENT_USER()\`).
2. Execute via SSH com \`--defaults-file="$HOME/.my-migrator.cnf"\` (veja \`hostinger/DEPLOY.md\`) sobre \`database/\` (\`001_initial.sql\`, \`002_hardening.sql\`, \`003_least_privilege.sql\`, \`004_indexes.sql\`, \`005_security_hardening.sql\`, \`006_security_alerts_and_ip_locks.sql\`):
   - Banco novo: \`php migrate.php --dry-run\` e depois \`php migrate.php\`
   - Banco existente em 004: \`php migrate.php --baseline=004\` e depois \`php migrate.php\` + \`php migrate-legacy-data.php --dry-run\` / execução real.

## 3. Configuração privada no servidor (\`ajn-carreiras-private/\`)

1. Confirme a presença de \`ajn-carreiras-private/resumes/.htaccess\` (bloqueia acesso HTTP caso alguém mova a pasta). Permissão em \`resumes/\`: \`0700\`.
2. Crie \`ajn-carreiras-private/config.php\` manualmente a partir de \`config.example.php\` (**este pacote não inclui nem sobrescreve \`config.php\`**):
   - \`environment\`: \`'staging'\` na homologação ou \`'production'\` em produção;
   - \`app_url\`: URL HTTPS exata do ambiente (ex.: \`'https://ajnengenharia.com.br'\`);
   - \`database\`: host, porta \`3306\`, nome, usuário de runtime (\`u000_ajn_app_rw\`) e senha;
   - \`resume_directory\`: \`__DIR__ . '/resumes'\` (fora de \`public_html\`);
   - \`encryption_key\`: 64 caracteres hexadecimais gerados com \`php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"\`;
   - \`previous_encryption_keys\`: array de chaves hex anteriores durante rotação de chave;
   - \`turnstile_secret_key\`: chave secreta Turnstile do mesmo par da \`PUBLIC_TURNSTILE_SITE_KEY\`;
   - \`security_alert_email\`: caixa corporativa que recebe alertas de segurança;
   - \`smtp\`: host, porta \`465\`, usuário, senha e remetente reais.

## 4. Provisionar superadmin, MFA, auditoria e expurgo via SSH (nunca pela web)

No diretório privado \`ajn-carreiras-private/\`:

\`\`\`bash
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \\
AJN_ADMIN_NAME="Administrador AJN" \\
AJN_ADMIN_INITIAL_PASSWORD="USE_UMA_FRASE_SENHA_COM_NO_MINIMO_16_CARACTERES" \\
php seed-admin.php
\`\`\`

- Guarde o segredo/URI TOTP e os 8 códigos de recuperação de uso único exibidos no cofre de senhas.
- Novos recrutadores/operadores criados no painel nascem inativos; ative cada um via SSH com:

\`\`\`bash
AJN_ADMIN_EMAIL="recrutador@ajnengenharia.com.br" php provision-user-mfa.php
\`\`\`

- Verificar integridade da cadeia de hashes da auditoria (\`audit_logs\`):

\`\`\`bash
php verify-audit-chain.php
\`\`\`

- Executar rotina de retenção/expurgo LGPD (agendar em Cron diário no hPanel):

\`\`\`bash
AJN_RETENTION_DAYS=730 php purge-expired-data.php
\`\`\`

## 5. Backup cifrado e teste periódico de restauração

\`\`\`bash
# 1. Dump + compactação + cifragem AES-256 (fora de public_html)
mysqldump --single-transaction --routines --triggers -u u000_ajn_app_rw -p u000_ajn_carreiras \\
  | gzip -9 \\
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out ~/backups/ajn-carreiras-$(date +%F).sql.gz.enc

# 2. Backup cifrado dos currículos privados
tar -czf - -C ~/ajn-carreiras-private resumes \\
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out ~/backups/ajn-resumes-$(date +%F).tar.gz.enc

# 3. Teste mensal de restauração em banco de homologação + validação da cadeia de auditoria
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in ~/backups/ajn-carreiras-$(date +%F).sql.gz.enc \\
  | gunzip \\
  | mysql -u u000_ajn_staging -p u000_ajn_carreiras_restore_test
php verify-audit-chain.php
\`\`\`

## 6. Verificação pós-upload

1. \`GET /api/health\` retorna \`200\` com \`{"status":"ok"}\` (em \`production\`, sem expor o campo \`environment\`).
2. \`GET /.env\` e \`GET /.git/config\` retornam \`403\` (ou bloqueio sem listar arquivos).
3. \`GET /ajn-carreiras-private/config.php\` retorna \`404\` (pasta inacessível pela web).
4. Testar em staging antes de produção: login MFA + step-up, criação de vaga, candidatura com PDF + Turnstile, e-mail SMTP de verificação/recuperação, download privado de currículo e exclusão LGPD + backup/restauração.
`;
}

function validateSafeServerPosixPath(rawValue, label) {
  const val = String(rawValue ?? '').trim();
  if (!val) {
    throw new Error(`${label} é obrigatório neste modo e deve apontar para caminho absoluto fora de public_html.`);
  }
  if (!val.startsWith('/')) {
    throw new Error(`${label} inválido ("${val}"): informe caminho absoluto POSIX iniciado em "/".`);
  }
  if (/[\r\n\0"']/.test(val) || /(?:^|\/)\.\.(?:\/|$)/.test(val)) {
    throw new Error(`${label} inválido ("${val}"): contém caracteres ou travessia não permitidos.`);
  }
  if (/(?:^|\/)(?:public_html|htdocs|httpdocs|www)(?:\/|$)/i.test(val)) {
    throw new Error(`${label} inseguro ("${val}"): não pode ficar dentro de webroot público.`);
  }
  return val.replace(/\/+$/, '') || '/';
}

function buildPrivateDirEnvLines(privateDir) {
  if (!privateDir) return [];
  return [
    '<IfModule mod_env.c>',
    `  SetEnv AJN_PRIVATE_DIR "${privateDir}"`,
    '</IfModule>',
    '<IfModule mod_setenvif.c>',
    `  SetEnvIf Request_URI "^" AJN_PRIVATE_DIR=${privateDir}`,
    '</IfModule>',
  ];
}

function injectMaintenanceFlagCondition(htaccessContent, privateDir) {
  if (!privateDir) return htaccessContent;
  const anchor = 'RewriteCond %{DOCUMENT_ROOT}/../ajn-carreiras-private/maintenance.flag -f [OR]';
  if (!htaccessContent.includes(anchor)) {
    throw new Error('Arquivo .htaccess base não contém a condição esperada de maintenance.flag.');
  }
  return htaccessContent.replace(
    anchor,
    `RewriteCond "${privateDir}/maintenance.flag" -f [OR]\n  ${anchor}`
  );
}

function buildProdPrivateDirHtaccessBlock(prodPrivateDir) {
  return [
    '# BEGIN AJN_PROD_PRIVATE_DIR (injetado exclusivamente em output/hostinger-deploy)',
    ...buildPrivateDirEnvLines(prodPrivateDir),
    '# END AJN_PROD_PRIVATE_DIR',
    '',
    '',
  ].join('\n');
}

function buildStagingAuthHtaccessBlock(htpasswdFile, stagingPrivateDir = '') {
  const lines = [
    '# BEGIN AJN_STAGING_BASIC_AUTH (injetado exclusivamente em output/hostinger-staging)',
    'AuthType Basic',
    'AuthName "AJN Staging - Acesso Restrito"',
    `AuthUserFile "${htpasswdFile}"`,
    'Require valid-user',
    '# END AJN_STAGING_BASIC_AUTH',
    ...buildPrivateDirEnvLines(stagingPrivateDir),
  ];
  return `${lines.join('\n')}\n\n`;
}

export function prepareHostingerDeploy({
  rootDir = process.cwd(),
  mode = 'production',
  outputDir = null,
  requireIndexing = mode !== 'staging',
  requireTurnstile = mode !== 'staging',
  stagingHtpasswdFile = process.env.STAGING_HTPASSWD_FILE ?? null,
  stagingPrivateDir = process.env.STAGING_PRIVATE_DIR ?? process.env.AJN_PRIVATE_DIR ?? '',
  prodPrivateDir = process.env.PROD_PRIVATE_DIR ?? '',
} = {}) {
  const normalizedMode = mode === 'staging' ? 'staging' : 'production';
  const productionDir = resolve(rootDir, 'output', 'hostinger-deploy');
  const defaultOutputDir = normalizedMode === 'staging'
    ? resolve(rootDir, 'output', 'hostinger-staging')
    : productionDir;
  const resolvedOutputDir = outputDir ? resolve(outputDir) : defaultOutputDir;
  if (normalizedMode === 'staging' && resolvedOutputDir === productionDir) {
    throw new Error('Pacote de staging não pode gravar na pasta de produção (output/hostinger-deploy).');
  }

  const distDir = resolve(rootDir, 'dist');
  const hostingerDir = resolve(rootDir, 'hostinger');
  const migrationsDir = join(hostingerDir, 'migrations');
  const publicHtaccessPath = resolve(rootDir, 'public', '.htaccess');
  const distHtaccessPath = join(distDir, '.htaccess');

  const buildSummary = inspectDistBuild(distDir);
  const tag = normalizedMode === 'staging' ? 'pack:hostinger:staging' : 'pack:hostinger';
  console.log(
    `[${tag}] Modo: ${normalizedMode} | Origem: ${buildSummary.canonicalOrigin} | Indexação: ${buildSummary.indexingAllowed} | Contato: ${buildSummary.contactEndpoint} | Turnstile no HTML: ${normalizedMode === 'staging' ? buildSummary.hasTurnstileSiteKey : buildSummary.turnstileEnabled}`
  );
  let validatedHtpasswdFile = '';
  let validatedStagingPrivateDir = '';
  let validatedProdPrivateDir = '';
  if (normalizedMode === 'staging') {
    if (!buildSummary.canonicalOrigin) {
      throw new Error('Pacote de staging rejeitado: PUBLIC_SITE_ORIGIN ausente no HTML compilado.');
    }
    let parsedOrigin;
    try {
      parsedOrigin = new URL(buildSummary.canonicalOrigin);
    } catch {
      throw new Error(`Pacote de staging rejeitado: PUBLIC_SITE_ORIGIN inválido (${buildSummary.canonicalOrigin}).`);
    }
    if (PRODUCTION_HOSTS.has(parsedOrigin.hostname.toLowerCase())) {
      throw new Error(
        `Pacote de staging rejeitado: PUBLIC_SITE_ORIGIN (${buildSummary.canonicalOrigin}) aponta para o domínio de produção.`
      );
    }
    if (buildSummary.indexingAllowed) {
      throw new Error('Pacote de staging rejeitado: Indexação está em true (staging exige PUBLIC_ALLOW_INDEXING=false).');
    }
    if (!buildSummary.robotsDisallowAll) {
      throw new Error('Pacote de staging rejeitado: robots.txt precisa conter Disallow: / e nenhum Allow: /.');
    }
    if (!buildSummary.allPagesNoindex) {
      throw new Error(
        `Pacote de staging rejeitado: páginas sem meta noindex: ${buildSummary.pagesWithoutNoindex.slice(0, 5).join(', ')}`
      );
    }
    if (!buildSummary.hasTurnstileSiteKey) {
      throw new Error('Pacote de staging rejeitado: Turnstile ausente no HTML (aceita chave de teste 1x ou real).');
    }
    validatedHtpasswdFile = validateSafeServerPosixPath(stagingHtpasswdFile, 'STAGING_HTPASSWD_FILE');
    if (String(stagingPrivateDir || '').trim() !== '') {
      validatedStagingPrivateDir = validateSafeServerPosixPath(stagingPrivateDir, 'STAGING_PRIVATE_DIR');
    }
  } else {
    if (requireIndexing && !buildSummary.indexingAllowed) {
      throw new Error('Pacote de produção rejeitado: Indexação está em false (noindex / Disallow).');
    }
    if (requireTurnstile && !buildSummary.turnstileEnabled) {
      const reason = buildSummary.isTurnstileTestKey
        ? `chave de teste Turnstile (${buildSummary.turnstileSiteKey}) não é permitida em produção`
        : 'Turnstile no HTML está em false';
      throw new Error(`Pacote de produção rejeitado: ${reason}.`);
    }
    validatedProdPrivateDir = validateSafeServerPosixPath(prodPrivateDir, 'PROD_PRIVATE_DIR');
  }
  assertRequiredFiles(hostingerDir, [...PRIVATE_RUNTIME_FILES, 'resumes-directory.htaccess'], 'hostinger');
  assertRequiredFiles(migrationsDir, MIGRATION_FILES, 'hostinger/migrations');

  for (const candidateHtaccess of [publicHtaccessPath, distHtaccessPath]) {
    if (existsSync(candidateHtaccess)) {
      const htRaw = readFileSync(candidateHtaccess, 'utf8');
      if (/\b(?:AuthType|AuthUserFile)\b/i.test(htRaw)) {
        throw new Error(`Arquivo .htaccess compartilhado não pode conter AuthType/AuthUserFile (${candidateHtaccess}).`);
      }
    }
  }

  for (const forbidden of FORBIDDEN_IN_PUBLIC_HTML) {
    if (existsSync(join(distDir, forbidden))) {
      throw new Error(`Conteúdo privado/proibido detectado dentro de dist/: ${forbidden}`);
    }
  }

  rmSync(resolvedOutputDir, { recursive: true, force: true });
  const publicDest = join(resolvedOutputDir, 'public_html');
  const privateDest = join(resolvedOutputDir, 'ajn-carreiras-private');
  const resumesDest = join(privateDest, 'resumes');
  const databaseDest = join(resolvedOutputDir, 'database');
  const opsDest = join(resolvedOutputDir, 'ops');

  mkdirSync(publicDest, { recursive: true });
  mkdirSync(resumesDest, { recursive: true });
  mkdirSync(databaseDest, { recursive: true });

  cpSync(distDir, publicDest, { recursive: true });

  for (const forbidden of FORBIDDEN_IN_PUBLIC_HTML) {
    if (existsSync(join(publicDest, forbidden))) {
      throw new Error(`Conteúdo privado/proibido detectado dentro de public_html/: ${forbidden}`);
    }
  }

  for (const file of PRIVATE_RUNTIME_FILES) {
    cpSync(join(hostingerDir, file), join(privateDest, file));
  }
  cpSync(join(hostingerDir, 'resumes-directory.htaccess'), join(resumesDest, '.htaccess'));

  for (const migration of MIGRATION_FILES) {
    cpSync(join(migrationsDir, migration), join(databaseDest, migration));
  }

  const hostingerOpsDir = join(hostingerDir, 'ops');
  if (existsSync(hostingerOpsDir)) {
    mkdirSync(opsDest, { recursive: true });
    for (const opFile of OPS_SHARED_FILES) {
      if (existsSync(join(hostingerOpsDir, opFile))) {
        cpSync(join(hostingerOpsDir, opFile), join(opsDest, opFile));
      }
    }
    if (normalizedMode === 'staging') {
      for (const stagingOp of OPS_STAGING_ONLY_FILES) {
        if (existsSync(join(hostingerOpsDir, stagingOp))) {
          cpSync(join(hostingerOpsDir, stagingOp), join(opsDest, stagingOp));
        }
      }
    }
  }

  const baseSync = verifyHtaccessCspSync(
    [existsSync(publicHtaccessPath) ? publicHtaccessPath : null, distHtaccessPath],
    { requireByteMatch: true }
  );
  if (!baseSync.ok) {
    throw new Error(`Divergência de CSP/.htaccess no empacotamento: ${baseSync.errors.join('; ')}`);
  }

  const packedHtaccessPath = join(publicDest, '.htaccess');
  if (normalizedMode === 'staging') {
    const existingHtaccess = readFileSync(packedHtaccessPath, 'utf8');
    let stagingHtaccess = buildStagingAuthHtaccessBlock(validatedHtpasswdFile, validatedStagingPrivateDir) + existingHtaccess;
    stagingHtaccess = injectMaintenanceFlagCondition(stagingHtaccess, validatedStagingPrivateDir);
    writeFileSync(packedHtaccessPath, stagingHtaccess, 'utf8');
  } else {
    const prodHtRaw = readFileSync(packedHtaccessPath, 'utf8');
    if (/\b(?:AuthType|AuthUserFile)\b/i.test(prodHtRaw)) {
      throw new Error('Pacote de produção rejeitado: public_html/.htaccess contém AuthType/AuthUserFile.');
    }
    let prodHtaccess = buildProdPrivateDirHtaccessBlock(validatedProdPrivateDir) + prodHtRaw;
    prodHtaccess = injectMaintenanceFlagCondition(prodHtaccess, validatedProdPrivateDir);
    writeFileSync(packedHtaccessPath, prodHtaccess, 'utf8');
  }

  const htaccessTargets = [
    existsSync(publicHtaccessPath) ? publicHtaccessPath : null,
    distHtaccessPath,
    packedHtaccessPath,
  ].filter(Boolean);
  const cspSync = verifyHtaccessCspSync(htaccessTargets, {
    requireByteMatch: false,
  });
  if (!cspSync.ok) {
    throw new Error(`Divergência de CSP/.htaccess no empacotamento: ${cspSync.errors.join('; ')}`);
  }

  const countFiles = (dir) => {
    let count = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) count += countFiles(join(dir, entry.name));
      else count += 1;
    }
    return count;
  };

  const summary = {
    ...buildSummary,
    mode: normalizedMode,
    generatedAt: new Date().toISOString(),
    outputDir: resolvedOutputDir,
    prodPrivateDir: validatedProdPrivateDir || null,
    stagingPrivateDir: validatedStagingPrivateDir || null,
    htaccessCspSha256: cspSync.cspSha256,
    htaccessEntries: cspSync.entries,
    publicFileCount: countFiles(publicDest),
    privateFileCount: countFiles(privateDest),
    migrationCount: countFiles(databaseDest),
  };

  writeFileSync(join(resolvedOutputDir, 'DEPLOY-CHECKLIST.md'), buildChecklistMarkdown(summary), 'utf8');
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const cliArgs = process.argv.slice(2);
  const mode = cliArgs.includes('--staging') ? 'staging' : 'production';
  const result = prepareHostingerDeploy({ mode });
  const tag = mode === 'staging' ? 'pack:hostinger:staging' : 'pack:hostinger';
  console.log(`[${tag}] Pacote gerado em: ${result.outputDir}`);
  console.log(`[${tag}] public_html: ${result.publicFileCount} arquivos | ajn-carreiras-private: ${result.privateFileCount} arquivos | database: ${result.migrationCount} SQLs`);
  console.log(`[${tag}] Origem: ${result.canonicalOrigin} | Indexação: ${result.indexingAllowed} | HTML noindex: ${result.allPagesNoindex} (${result.htmlFileCount}) | Contato: ${result.contactEndpoint} | Turnstile no HTML: ${mode === 'staging' ? result.hasTurnstileSiteKey : result.turnstileEnabled}`);
  if (mode === 'production' && result.prodPrivateDir) {
    console.log(`[${tag}] SetEnv AJN_PRIVATE_DIR="${result.prodPrivateDir}" e maintenance.flag injetados apenas em output/hostinger-deploy/public_html/.htaccess`);
  }
  console.log(`[${tag}] SHA-256 CSP (.htaccess sincronizado): ${result.htaccessCspSha256}`);
  if (!result.turnstileEnabled && mode === 'production') {
    console.warn(`[${tag}] AVISO: dist/ foi gerado sem PUBLIC_TURNSTILE_SITE_KEY; formulários públicos de carreiras exigirão rebuild com essa variável antes de aceitar envios em produção.`);
  }
}
