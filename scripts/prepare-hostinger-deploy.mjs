import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PRIVATE_RUNTIME_FILES = [
  'admin.php',
  'app.php',
  'applications.php',
  'bootstrap.php',
  'lgpd.php',
  'provision-user-mfa.php',
  'seed-admin.php',
  'config.example.php',
];

const MIGRATION_FILES = [
  '001_initial.sql',
  '002_hardening.sql',
  '003_least_privilege.sql',
  '004_indexes.sql',
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
      '- **BLOQUEIO CRITICO — Turnstile ausente no HTML:** o build atual foi gerado sem `PUBLIC_TURNSTILE_SITE_KEY`. Candidaturas, recuperação de código e solicitações LGPD falharão até rebuildar com `PUBLIC_TURNSTILE_SITE_KEY` e rodar `npm run pack:hostinger` novamente.'
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

- \`public_html/\` (${summary.publicFileCount} arquivos): enviar para a raiz web \`public_html/\` do domínio na Hostinger (inclui \`.htaccess\` e \`api/index.php\`).
- \`ajn-carreiras-private/\` (${summary.privateFileCount} arquivos): enviar para **fora** de \`public_html/\`, como pasta irmã (\`../ajn-carreiras-private/\`). **Nunca colocar dentro de \`public_html/\`.**
- \`database/\` (${summary.migrationCount} migrations SQL): importar no banco MySQL/MariaDB dedicado ao módulo de carreiras, na ordem numérica \`001\` -> \`002\` -> \`003\` -> \`004\`. **Não enviar para \`public_html/\`.**

## 2. Banco de dados (banco exclusivo de carreiras)

1. Crie um banco MySQL/MariaDB separado (não usar o banco do WordPress legado).
2. Importe via phpMyAdmin ou CLI nesta ordem exata:
   - \`database/001_initial.sql\`
   - \`database/002_hardening.sql\`
   - \`database/003_least_privilege.sql\`
   - \`database/004_indexes.sql\`

## 3. Configuração privada no servidor (\`ajn-carreiras-private/\`)

1. Confirme a presença de \`ajn-carreiras-private/resumes/.htaccess\` (bloqueia acesso HTTP caso alguém mova a pasta). Preferência de permissão em \`resumes/\`: \`0700\`.
2. Crie \`ajn-carreiras-private/config.php\` manualmente a partir de \`config.example.php\` (**este pacote não inclui nem sobrescreve \`config.php\`**):
   - \`environment\`: \`'staging'\` na homologação ou \`'production'\` em produção;
   - \`app_url\`: URL HTTPS exata do ambiente (ex.: \`'https://ajnengenharia.com.br'\`);
   - \`database\`: host, porta \`3306\`, nome, usuário e senha do banco exclusivo;
   - \`resume_directory\`: \`__DIR__ . '/resumes'\` (fora de \`public_html\`);
   - \`encryption_key\`: 64 caracteres hexadecimais gerados com \`php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"\`;
   - \`turnstile_secret_key\`: chave secreta Turnstile do mesmo par da \`PUBLIC_TURNSTILE_SITE_KEY\`;
   - \`smtp\`: host, porta \`465\`, usuário, senha e remetente reais.

## 4. Provisionar superadmin e MFA via SSH (nunca pela web)

No diretório privado \`ajn-carreiras-private/\`:

\`\`\`bash
AJN_ADMIN_EMAIL="admin@ajnengenharia.com.br" \\
AJN_ADMIN_NAME="Administrador AJN" \\
AJN_ADMIN_INITIAL_PASSWORD="USE_UMA_FRASE_SENHA_COM_NO_MINIMO_16_CARACTERES" \\
php seed-admin.php
\`\`\`

- Guarde o segredo/URI TOTP exibido uma única vez no seu autenticador.
- Novos recrutadores/operadores criados no painel nascem inativos; ative cada um via SSH com:

\`\`\`bash
AJN_ADMIN_EMAIL="recrutador@ajnengenharia.com.br" php provision-user-mfa.php
\`\`\`

## 5. Verificação pós-upload

1. \`GET /api/health\` retorna \`200\` com \`{"status":"ok"}\` (em \`production\`, sem expor o campo \`environment\`).
2. \`GET /.env\` e \`GET /.git/config\` retornam \`403\` (ou bloqueio sem listar arquivos).
3. \`GET /ajn-carreiras-private/config.php\` retorna \`404\` (pasta inacessível pela web).
4. Testar em staging antes de produção: login MFA do zero, criação de vaga, candidatura com PDF + Turnstile, e-mail SMTP de verificação/recuperação, download privado de currículo e exclusão LGPD + backup/restauração.
`;
}

export function prepareHostingerDeploy({
  rootDir = process.cwd(),
  outputDir = resolve(rootDir, 'output', 'hostinger-deploy'),
} = {}) {
  const distDir = resolve(rootDir, 'dist');
  const hostingerDir = resolve(rootDir, 'hostinger');
  const migrationsDir = join(hostingerDir, 'migrations');

  const buildSummary = inspectDistBuild(distDir);
  assertRequiredFiles(hostingerDir, [...PRIVATE_RUNTIME_FILES, 'resumes-directory.htaccess'], 'hostinger');
  assertRequiredFiles(migrationsDir, MIGRATION_FILES, 'hostinger/migrations');

  for (const forbidden of ['config.php', 'hostinger', 'migrations', 'tests']) {
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
