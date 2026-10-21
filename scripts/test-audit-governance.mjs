import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	auditDependabotSource,
	auditRequiredWorkflowIdentity,
	REQUIRED_SECURITY_WORKFLOWS,
} from './audit-governance.mjs';

const validDependabot = [
	'version: 2',
	'updates:',
	'  - package-ecosystem: npm',
	'    directory: /',
	'    schedule:',
	'      interval: weekly',
	'      day: monday',
	'      time: "09:00"',
	'      timezone: America/Sao_Paulo',
	'  - package-ecosystem: github-actions',
	'    directory: /',
	'    schedule:',
	'      interval: weekly',
	'      day: monday',
	'      time: "09:30"',
	'      timezone: America/Sao_Paulo',
].join('\n') + '\n';

test('aceita Dependabot completo e rejeita version, diretório, agenda e duplicidade inválidos', () => {
	assert.deepEqual(auditDependabotSource(validDependabot), []);
	assert.match(auditDependabotSource(validDependabot.replace('version: 2', 'version: 1')).join('\n'), /version.*2/);
	assert.match(auditDependabotSource(validDependabot.replace('directory: /', 'directory: /packages/site')).join('\n'), /directory.*\//);
	assert.match(auditDependabotSource(validDependabot.replace('interval: weekly', 'interval: monthly')).join('\n'), /interval.*weekly/);
	assert.match(auditDependabotSource(validDependabot.replace('day: monday', 'day: sunday')).join('\n'), /day.*monday/);
	assert.match(auditDependabotSource(validDependabot.replace('time: "09:00"', 'time: "99:00"')).join('\n'), /time.*HH:MM/);
	assert.match(auditDependabotSource(validDependabot.replace(
		'  - package-ecosystem: github-actions',
		'  - package-ecosystem: npm',
	)).join('\n'), /updates deve conter exatamente os alvos/);
});

test('exige a identidade dos workflows de segurança, inclusive em remoção ou renomeação', () => {
	const complete = ['browser-smoke.yml', 'codeql.yml', 'dependency-review.yml', 'gitleaks.yml', 'live-security.yml', 'quality.yml'];
	assert.deepEqual(auditRequiredWorkflowIdentity(complete), []);
	for (const required of REQUIRED_SECURITY_WORKFLOWS) {
		const removed = complete.filter((file) => file !== required);
		assert.match(auditRequiredWorkflowIdentity(removed).join('\n'), new RegExp(required.replace('.', '\\.')));
		const renamed = complete.map((file) => file === required ? 'renamed-' + required : file);
		assert.match(auditRequiredWorkflowIdentity(renamed).join('\n'), new RegExp(required.replace('.', '\\.')));
	}
});
