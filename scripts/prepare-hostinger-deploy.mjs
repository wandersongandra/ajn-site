import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PRIVATE_RUNTIME_FILES = [
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
];

const MIGRATION_FILES = [
  '001_initial.sql',
  '002_hardening.sql',
  '003_least_privilege.sql',
  '004_indexes.sql',
  '005_security_hardening.sql',
];

const FORBIDDEN_IN_PUBLIC_HTML = [
  'config.php',
  'config.example.php',
  'hostinger',
  'migrations',
  'tests',
  'seed-admin.php',
  'provision-user-mfa.php',
  'verify-audit-chain.php',
  'purge-expired-data.php',
  'migrate-legacy-data.php',
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

export function inspectDistBuild(distDir) {
  assertRequiredFiles(distDir, REQUIRED_DIST_FILES, 'dist');

  const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
  const contactHtml = readFileSync(join(distDir, 'contato/index.html'), 'utf8');
  const talentHtml = readFileSync(join(distDir, 'carreiras/talentos/index.html'), 'utf8');
  const robotsTxt = readFileSync(join(distDir, 'robots.txt'), 'utf8');

  const canonicalMatch = homeHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const canonicalUrl = canonicalMatch?.[1] ?? '';
  const canonicalOrigin = canonicalUrl ? canonicalUrl.replace(/\/+$/, '') : '';

  const indexingAllowed = /<meta\s+name="robots"\s+content="index,follow/i.test(homeHtml)
    && !robotsTxt.includes('Disallow: /');

  const contactMatch = contactHtml.match(/data-contact-endpoint="([^"]*)"/i);
  const contactEndpoint = contactMatch?.[1] ?? '';
  const turnstileEnabled = /class="cf-turnstile"/i.test(talentHtml);

  return { canonicalOrigin, indexingAllowed, contactEndpoint, turnstileEnabled };
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

  return `# Pacote de Deploy Hostinger — AJN Consultoria e Engenharia

Gerado em: ${summary.generatedAt}
Origem compilada (\`PUBLIC_SITE_ORIGIN\`): ${summary.canonicalOrigin || '(não detectada)'}
Indexação permitida: ${summary.indexingAllowed ? 'SIM (`index,follow`)' : 'NAO (`noindex` / staging)'}
Endpoint de contato: ${summary.contactEndpoint || '(desativado)'}
Turnstile no HTML (\`PUBLIC_TURNSTILE_SITE_KEY\`): ${summary.turnstileEnabled ? 'ATIVO (`.cf-turnstile` presente)' : 'AUSENTE — REBUILD NECESSARIO'}

${blockers.length ? `## Alertas deste pacote\n\n${blockers.join('\n')}\n` : '## Status do pacote\n\nBuild coerente para publicação após configurar `config.php`, banco e MFA no servidor.\n'}
## 1. Estrutura gerada

- \`public_html/\` (${summary.publicFileCount} arquivos): enviar para a raiz web \`public_html/\` do domínio na Hostinger (inclui \`.htaccess\`, \`.well-known/security.txt\` e \`api/index.php\`).
- \`ajn-carreiras-private/\` (${summary.privateFileCount} arquivos): enviar para **fora** de \`public_html/\`, como pasta irmã (\`../ajn-carreiras-private/\`). **Nunca colocar dentro de \`public_html/\`.**
- \`database/\` (${summary.migrationCount} migrations SQL): importar no banco MySQL/MariaDB dedicado ao módulo de carreiras, na ordem numérica \`001\` -> \`002\` -> \`003\` -> \`004\` -> \`005\`. **Não enviar para \`public_html/\`.**

## 2. Banco de dados e menor privilégio (usuário de migration vs runtime)

1. Crie um banco MySQL/MariaDB exclusivo para carreiras e **dois usuários distintos** no hPanel (ou via DBA):
   - \`u000_ajn_migrator\`: usado apenas para importar \`001_initial.sql\`, \`002_hardening.sql\`, \`003_least_privilege.sql\`, \`004_indexes.sql\` e \`005_security_hardening.sql\`.
   - \`u000_ajn_app_rw\`: usuário de runtime em \`config.php\`, restrito exclusivamente a \`SELECT, INSERT, UPDATE, DELETE\` nas tabelas do sistema (sem \`DROP\`, \`ALTER\`, \`CREATE\` ou \`TRUNCATE\`).
2. Importe via phpMyAdmin ou CLI nesta ordem exata:
   - \`database/001_initial.sql\`
   - \`database/002_hardening.sql\`
   - \`database/003_least_privilege.sql\`
   - \`database/004_indexes.sql\`
   - \`database/005_security_hardening.sql\`

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

export function prepareHostingerDeploy({
  rootDir = process.cwd(),
  outputDir = resolve(rootDir, 'output', 'hostinger-deploy'),
  requireIndexing = false,
  requireTurnstile = false,
} = {}) {
  const distDir = resolve(rootDir, 'dist');
  const hostingerDir = resolve(rootDir, 'hostinger');
  const migrationsDir = join(hostingerDir, 'migrations');

  const buildSummary = inspectDistBuild(distDir);
  if (requireIndexing && !buildSummary.indexingAllowed) {
    throw new Error('Pacote de produção rejeitado: Indexação está em false (noindex / Disallow).');
  }
  if (requireTurnstile && !buildSummary.turnstileEnabled) {
    throw new Error('Pacote de produção rejeitado: Turnstile no HTML está em false.');
  }
  assertRequiredFiles(hostingerDir, [...PRIVATE_RUNTIME_FILES, 'resumes-directory.htaccess'], 'hostinger');
  assertRequiredFiles(migrationsDir, MIGRATION_FILES, 'hostinger/migrations');

  for (const forbidden of FORBIDDEN_IN_PUBLIC_HTML) {
    if (existsSync(join(distDir, forbidden))) {
      throw new Error(`Conteúdo privado/proibido detectado dentro de dist/: ${forbidden}`);
    }
  }

  rmSync(outputDir, { recursive: true, force: true });
  const publicDest = join(outputDir, 'public_html');
  const privateDest = join(outputDir, 'ajn-carreiras-private');
  const resumesDest = join(privateDest, 'resumes');
  const databaseDest = join(outputDir, 'database');

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
    generatedAt: new Date().toISOString(),
    outputDir,
    publicFileCount: countFiles(publicDest),
    privateFileCount: countFiles(privateDest),
    migrationCount: countFiles(databaseDest),
  };

  writeFileSync(join(outputDir, 'DEPLOY-CHECKLIST.md'), buildChecklistMarkdown(summary), 'utf8');
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = prepareHostingerDeploy();
  console.log(`[pack:hostinger] Pacote gerado em: ${result.outputDir}`);
  console.log(`[pack:hostinger] public_html: ${result.publicFileCount} arquivos | ajn-carreiras-private: ${result.privateFileCount} arquivos | database: ${result.migrationCount} SQLs`);
  console.log(`[pack:hostinger] Origem: ${result.canonicalOrigin} | Indexação: ${result.indexingAllowed} | Contato: ${result.contactEndpoint} | Turnstile no HTML: ${result.turnstileEnabled}`);
  if (!result.turnstileEnabled) {
    console.warn('[pack:hostinger] AVISO: dist/ foi gerado sem PUBLIC_TURNSTILE_SITE_KEY; formulários públicos de carreiras exigirão rebuild com essa variável antes de aceitar envios em produção.');
  }
}
