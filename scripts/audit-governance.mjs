// Verifica controles de governança versionados; não simula configurações administrativas do GitHub.
import { readFile } from 'node:fs/promises';
import { parseDocument } from 'yaml';
import { auditWorkflowFiles } from './audit-workflows.mjs';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const codeowners = await readFile('.github/CODEOWNERS', 'utf8').catch(() => '');
const security = await readFile('SECURITY.md', 'utf8').catch(() => '');
const dependabot = await readFile('.github/dependabot.yml', 'utf8').catch(() => '');
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

check(/^\*\s+@wandersongandra\s*$/m.test(codeowners), 'CODEOWNERS deve exigir o proprietário para todos os caminhos.');
check((security.includes('private vulnerability reporting') || security.includes('Report a vulnerability')) &&
	/security/i.test(security) && /public issues/i.test(security),
	'SECURITY.md deve orientar reporte privado e evitar divulgação pública.');
try {
	const document = parseDocument(dependabot, { strict: true, uniqueKeys: true });
	const config = document.toJS();
	const ecosystems = new Set((config.updates ?? []).map((entry) => entry['package-ecosystem']));
	check(ecosystems.has('npm') && ecosystems.has('github-actions'),
		'Dependabot deve cobrir npm e GitHub Actions.');
	check((config.updates ?? []).every((entry) => entry.schedule?.interval === 'weekly'),
		'Dependabot deve manter frequência semanal explícita.');
} catch (error) {
	failures.push(`Dependabot YAML inválido: ${error.message}`);
}
check(packageJson.engines?.node === '>=22.12.0', 'Versão mínima de Node deve permanecer declarada.');

const workflowAudit = await auditWorkflowFiles();
for (const failure of workflowAudit.failures) failures.push(failure);
check(workflowAudit.files.length >= 6, 'Workflows esperados não foram encontrados.');

if (failures.length) {
	for (const failure of failures) console.error('[governance][FAIL]', failure);
	process.exitCode = 1;
} else {
	console.log(`[governance] PASS: CODEOWNERS, SECURITY.md, Dependabot e ${workflowAudit.files.length} workflows auditados.`);
}
