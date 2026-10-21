// Verifica controles de governança versionados; não simula configurações administrativas do GitHub.
import { readFile } from 'node:fs/promises';
import { parseDocument } from 'yaml';
import { auditWorkflowFiles } from './audit-workflows.mjs';

const EXPECTED_DEPENDABOT = new Set(['npm:/', 'github-actions:/']);
export const REQUIRED_SECURITY_WORKFLOWS = [
	'codeql.yml',
	'gitleaks.yml',
	'dependency-review.yml',
];

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidTimeZone(value) {
	if (typeof value !== 'string' || !value) return false;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
}

export function auditDependabotSource(source, file = '.github/dependabot.yml') {
	const failures = [];
	const check = (condition, message) => {
		if (!condition) failures.push(file + ': ' + message);
	};
	let config;
	try {
		const document = parseDocument(source, { strict: true, uniqueKeys: true });
		if (document.errors.length) {
			for (const error of document.errors) failures.push(file + ': YAML inválido (' + error.message + ').');
			return failures;
		}
		config = document.toJS();
	} catch (error) {
		return [file + ': YAML inválido (' + error.message + ').'];
	}

	check(isPlainObject(config), 'a raiz deve ser um mapa YAML.');
	if (!isPlainObject(config)) return failures;
	check(config.version === 2, 'version deve ser exatamente 2.');
	check(Array.isArray(config.updates), 'updates deve ser uma lista.');
	if (!Array.isArray(config.updates)) return failures;

	const seen = new Set();
	for (const [index, entry] of config.updates.entries()) {
		const label = 'updates[' + index + ']';
		check(isPlainObject(entry), label + ' deve ser um mapa.');
		if (!isPlainObject(entry)) continue;

		const ecosystem = entry['package-ecosystem'];
		const directory = entry.directory;
		const key = String(ecosystem) + ':' + String(directory);
		check(typeof ecosystem === 'string' && ecosystem.length > 0, label + '.package-ecosystem é obrigatório.');
		check(directory === '/', label + '.directory deve ser / para os manifestos deste repositório.');
		if (seen.has(key)) check(false, label + ' duplica o alvo ' + key + '.');
		seen.add(key);

		const schedule = entry.schedule;
		check(isPlainObject(schedule), label + '.schedule deve ser um mapa.');
		if (!isPlainObject(schedule)) continue;
		check(schedule.interval === 'weekly', label + '.schedule.interval deve ser weekly.');
		check(schedule.day === 'monday', label + '.schedule.day deve ser monday.');
		check(typeof schedule.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(schedule.time),
			label + '.schedule.time deve estar em HH:MM.');
		check(isValidTimeZone(schedule.timezone), label + '.schedule.timezone deve ser um fuso IANA válido.');
		if (entry['open-pull-requests-limit'] !== undefined) {
			check(Number.isInteger(entry['open-pull-requests-limit']) && entry['open-pull-requests-limit'] > 0,
				label + '.open-pull-requests-limit deve ser inteiro positivo.');
		}
		if (entry.labels !== undefined) {
			check(Array.isArray(entry.labels) && entry.labels.every((labelValue) => typeof labelValue === 'string'),
				label + '.labels deve ser uma lista de strings.');
		}
	}

	check(EXPECTED_DEPENDABOT.size === seen.size &&
		[...EXPECTED_DEPENDABOT].every((key) => seen.has(key)),
		'updates deve conter exatamente os alvos npm:/ e github-actions:/.');
	check(config.updates.length === EXPECTED_DEPENDABOT.size,
		'updates não deve conter entradas extras ou duplicadas.');
	return failures;
}

export function auditRequiredWorkflowIdentity(files) {
	const failures = [];
	const names = new Set(files);
	if (names.size !== files.length) failures.push('Workflows duplicados não são aceitos.');
	for (const required of REQUIRED_SECURITY_WORKFLOWS) {
		if (!names.has(required)) failures.push('Workflow obrigatório ausente: ' + required + '.');
	}
	return failures;
}

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
failures.push(...auditDependabotSource(dependabot));
check(packageJson.engines?.node === '>=22.12.0', 'Versão mínima de Node deve permanecer declarada.');

const workflowAudit = await auditWorkflowFiles();
for (const failure of workflowAudit.failures) failures.push(failure);
failures.push(...auditRequiredWorkflowIdentity(workflowAudit.files));
check(workflowAudit.files.length >= 6, 'Workflows esperados não foram encontrados.');

if (failures.length) {
	for (const failure of failures) console.error('[governance][FAIL]', failure);
	process.exitCode = 1;
} else {
	console.log(`[governance] PASS: CODEOWNERS, SECURITY.md, Dependabot e ${workflowAudit.files.length} workflows auditados.`);
}
