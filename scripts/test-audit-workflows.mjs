import { test } from 'node:test';
import assert from 'node:assert/strict';
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
	const workflow = baseWorkflow(`  build:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - run: echo \${{ secrets.GITHUB_TOKEN }}\n      - run: echo \${{ secrets [ "GITHUB_TOKEN" ] }}\n      - run: echo \${{ secrets [ 'GITHUB_TOKEN' ] }}\n`);
	assert.deepEqual(auditWorkflowSource(workflow, 'secret-github-token.yml'), []);
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
