import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditWorkflowFiles, auditWorkflowSource } from './audit-workflows.mjs';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const DIGEST = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function baseWorkflow(body) {
	return `name: fixture\non: push\npermissions: { contents: read }\njobs:\n${body}`;
}

test('rejeita Docker com tag mutável e aceita digest SHA-256, SHA de Action e Action local', () => {
	const mutable = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: docker://alpine:3.20\n`);
	assert.match(auditWorkflowSource(mutable, 'docker-tag.yml').join('\n'), /digest SHA-256/);

	const immutable = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: docker://alpine:3.20@sha256:${DIGEST}\n      - uses: actions/checkout@${SHA}\n      - uses: ./.github/actions/local\n`);
	assert.deepEqual(auditWorkflowSource(immutable, 'docker-digest.yml'), []);
});

test('inspeciona permissões inline em jobs e preserva a exceção CodeQL legítima', () => {
	const write = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    permissions: { contents: write }\n    steps: []\n`);
	assert.match(auditWorkflowSource(write, 'permissions-inline.yml').join('\n'), /job build\.permissions\.contents/);

	const codeql = baseWorkflow(`  analyze:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    permissions: { security-events: write }\n    steps:\n      - uses: github/codeql-action/analyze@${SHA}\n`);
	assert.deepEqual(auditWorkflowSource(codeql, 'permissions-codeql.yml'), []);
});

test('aplica a proibição de pull_request_target na estrutura YAML sem falso positivo textual', () => {
	const forbidden = `name: fixture\non: [push, pull_request_target]\npermissions: { contents: read }\njobs:\n  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps: []\n`;
	assert.match(auditWorkflowSource(forbidden, 'pull-request-target.yml').join('\n'), /pull_request_target/);

	const commentOnly = `${baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: echo "pull_request_target:"\n`)}\n# pull_request_target: is not enabled\n`;
	assert.deepEqual(auditWorkflowSource(commentOnly, 'pull-request-target-comment.yml'), []);
});

test('detecta segredos em notação de ponto, colchetes e referências dinâmicas', () => {
	for (const [name, expression] of [
		['dot', '${{ secrets . DEPLOY_TOKEN }}'],
		['double-bracket', '${{ secrets [ "DEPLOY_TOKEN" ] }}'],
		['single-bracket', "${{ secrets [ 'DEPLOY_TOKEN' ] }}"],
		['dynamic-bracket', '${{ secrets [ env.SECRET_NAME ] }}'],
	]) {
		const workflow = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: echo ${expression}\n`);
		assert.match(auditWorkflowSource(workflow, `secret-${name}.yml`).join('\n'), /secrets|secreta/i);
	}
});

test('permite somente GITHUB_TOKEN em ponto e colchetes', () => {
	const workflow = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: echo 'variáveis injetadas via env'\n        env:\n          TOKEN_DOT: \${{ secrets.GITHUB_TOKEN }}\n          TOKEN_DOUBLE: \${{ secrets [ "GITHUB_TOKEN" ] }}\n          TOKEN_SINGLE: \${{ secrets [ 'GITHUB_TOKEN' ] }}\n`);
	assert.deepEqual(auditWorkflowSource(workflow, 'secret-github-token.yml'), []);
});

test('bloqueia interpolação direta de dados de PR e segredos em comandos shell', () => {
	for (const expression of ['\${{ github.event.pull_request.title }}', '\${{ secrets.GITHUB_TOKEN }}']) {
		const unsafe = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: echo ${expression}\n`);
		assert.match(auditWorkflowSource(unsafe, 'unsafe-run.yml').join('\n'), /diretamente em run/);
	}
	const safe = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: printf '%s' "$PR_TITLE"\n        env:\n          PR_TITLE: \${{ github.event.pull_request.title }}\n`);
	assert.deepEqual(auditWorkflowSource(safe, 'safe-env.yml'), []);
});

test('impede remover ou limitar verificações obrigatórias de todas as PRs', async () => {
	for (const file of ['quality.yml', 'codeql.yml', 'gitleaks.yml', 'dependency-review.yml']) {
		const rawSource = await readFile(`.github/workflows/${file}`, 'utf8');
		const source = rawSource.replaceAll('\r\n', '\n');
		assert.deepEqual(auditWorkflowSource(source, file), []);
		const removedTrigger = source.replace('  pull_request:\n', '');
		assert.match(auditWorkflowSource(removedTrigger, file).join('\n'), /precisa executar em pull_request/);
		const pathsFiltered = source.replace('  pull_request:\n', "  pull_request:\n    paths: ['src/**']\n");
		assert.match(auditWorkflowSource(pathsFiltered, file).join('\n'), /não pode filtrar pull_request/);
	}
	const rawQuality = await readFile('.github/workflows/quality.yml', 'utf8');
	const quality = rawQuality.replaceAll('\r\n', '\n');
	const branchFiltered = quality.replace('  pull_request:\n', '  pull_request:\n    branches: [staging]\n');
	assert.match(auditWorkflowSource(branchFiltered, 'quality.yml').join('\n'), /não pode filtrar pull_request/);
	const conditionalJob = quality.replace('  validate:\n', "  validate:\n    if: github.ref == 'refs/heads/main'\n");
	assert.match(auditWorkflowSource(conditionalJob, 'quality.yml').join('\n'), /jobs de segurança.*condicionais/);
	const removedAudit = quality.replace('      - name: Security baseline audit\n        run: npm run audit:security\n', '');
	assert.match(auditWorkflowSource(removedAudit, 'quality.yml').join('\n'), /etapa obrigatória.*audit:security/);
	const persistedCheckout = quality.replace('          persist-credentials: false\n', '');
	assert.match(auditWorkflowSource(persistedCheckout, 'quality.yml').join('\n'), /checkout deve remover credenciais/);
	const rawDependency = await readFile('.github/workflows/dependency-review.yml', 'utf8');
	const dependency = rawDependency.replaceAll('\r\n', '\n');
	assert.match(auditWorkflowSource(dependency.replace('        run: npm audit --audit-level=high\n', ''), 'dependency-review.yml').join('\n'), /etapa obrigatória.*npm audit/);
	const rawGitleaks = await readFile('.github/workflows/gitleaks.yml', 'utf8');
	const gitleaks = rawGitleaks.replaceAll('\r\n', '\n');
	assert.match(auditWorkflowSource(gitleaks.replace(/^\s+uses: gitleaks\/gitleaks-action@.*$/m, ''), 'gitleaks.yml').join('\n'), /ação de segurança obrigatória.*gitleaks/);
});

test('os seis workflows versionados atuais permanecem válidos', async () => {
	const { files, failures } = await auditWorkflowFiles();
	assert.deepEqual(files, [
		'browser-smoke.yml',
		'codeql.yml',
		'dependency-review.yml',
		'gitleaks.yml',
		'live-security.yml',
		'quality.yml',
	]);
	assert.deepEqual(failures, []);
});
