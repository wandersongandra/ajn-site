import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const DEFAULT_DIRECTORY = '.github/workflows';
const ALLOWED_PERMISSION_VALUES = new Set(['read', 'write', 'none']);
const READ_ONLY_PERMISSION_VALUES = new Set(['read', 'read-all', 'none']);
const SECRET_REFERENCE_PATTERN = /\bsecrets\b(?:\s*\.\s*([A-Za-z_][A-Za-z0-9_-]*)|\s*\[\s*(?:"([^"]*)"|'([^']*)'|([^\]]+))\s*\])?/g;

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collectValuesByKey(value, key, result = []) {
	if (Array.isArray(value)) {
		for (const item of value) collectValuesByKey(item, key, result);
		return result;
	}
	if (!isPlainObject(value)) return result;
	for (const [entryKey, entryValue] of Object.entries(value)) {
		if (entryKey === key) result.push(entryValue);
		collectValuesByKey(entryValue, key, result);
	}
	return result;
}

function inspectPermissionValue(value, label, failures) {
	if (value === null || value === undefined) return;
	if (typeof value === 'string') {
		if (!READ_ONLY_PERMISSION_VALUES.has(value) && value !== 'write') {
			failures.push(`${label}: valor de permissions inválido (${value}).`);
		}
		if (value === 'write') failures.push(`${label}: write-all não é permitido.`);
		return;
	}
	if (!isPlainObject(value)) {
		failures.push(`${label}: permissions deve ser um mapa ou escalar YAML válido.`);
		return;
	}
	for (const [permission, level] of Object.entries(value)) {
		if (typeof level !== 'string' || !ALLOWED_PERMISSION_VALUES.has(level)) {
			failures.push(`${label}.${permission}: nível de permission inválido (${String(level)}).`);
			continue;
		}
		if (level === 'write') failures.push({ permission, label });
	}
}

function hasReadContentsPermission(value) {
	if (typeof value === 'string') return value === 'read' || value === 'read-all';
	return isPlainObject(value) && value.contents === 'read';
}

function hasPullRequestTargetTrigger(workflow) {
	const trigger = workflow.on;
	if (trigger === 'pull_request_target') return true;
	if (Array.isArray(trigger)) return trigger.includes('pull_request_target');
	return isPlainObject(trigger) && Object.hasOwn(trigger, 'pull_request_target');
}

function isCodeqlAnalyzeAction(value) {
	return typeof value === 'string' && /^github\/codeql-action\/analyze@[0-9a-f]{40}$/i.test(value);
}

function auditPermissions(workflow, file, failures) {
	if (!Object.hasOwn(workflow, 'permissions')) {
		failures.push(`${file}: permissions global é obrigatório.`);
		return;
	}
	const globalPermissions = workflow.permissions;
	const globalFailures = [];
	inspectPermissionValue(globalPermissions, `${file}: permissions global`, globalFailures);
	for (const failure of globalFailures) {
		if (typeof failure === 'object') {
			failures.push(`${file}: permissions global.${failure.permission}: write não é permitido.`);
		} else {
			failures.push(failure);
		}
	}
	if (!hasReadContentsPermission(globalPermissions)) {
		failures.push(`${file}: permissions global deve conceder contents: read.`);
	}

	if (!isPlainObject(workflow.jobs)) return;
	for (const [jobId, job] of Object.entries(workflow.jobs)) {
		if (!isPlainObject(job)) continue;
		if (Object.hasOwn(job, 'permissions')) {
			const jobFailures = [];
			inspectPermissionValue(job.permissions, `${file}: job ${jobId}.permissions`, jobFailures);
			for (const failure of jobFailures) {
				if (typeof failure === 'object') {
					const allowed = failure.permission === 'security-events'
						&& collectValuesByKey(job, 'uses').some(isCodeqlAnalyzeAction);
					if (!allowed) {
						failures.push(`${file}: job ${jobId}.permissions.${failure.permission}: write não é permitido sem exceção CodeQL legítima.`);
					}
				} else {
					failures.push(failure);
				}
			}
		}
		if (Object.hasOwn(job, 'runs-on') && !Object.hasOwn(job, 'timeout-minutes')) {
			failures.push(`${file}: job ${jobId} precisa de timeout-minutes explícito.`);
		}
	}
}

function auditActionReference(value, file, failures) {
	if (typeof value !== 'string') {
		failures.push(`${file}: referência uses deve ser uma string YAML.`);
		return;
	}
	if (value.startsWith('./')) return;
	if (value.startsWith('docker://')) {
		if (!/^docker:\/\/[^@\s]+@sha256:[0-9a-f]{64}$/i.test(value)) {
			failures.push(`${file}: ação Docker ${value} deve usar digest SHA-256 imutável.`);
		}
		return;
	}
	const at = value.lastIndexOf('@');
	const action = at > 0 ? value.slice(0, at) : value;
	const reference = at > 0 ? value.slice(at + 1) : '';
	if (!at || !/^[0-9a-f]{40}$/i.test(reference)) {
		failures.push(`${file}: ação externa ${action} não está fixada em SHA completo.`);
	}
}

function auditSecrets(value, file, failures) {
	if (Array.isArray(value)) {
		for (const item of value) auditSecrets(item, file, failures);
		return;
	}
	if (isPlainObject(value)) {
		for (const item of Object.values(value)) auditSecrets(item, file, failures);
		return;
	}
	if (typeof value !== 'string') return;
	const expressions = value.matchAll(/\$\{\{([\s\S]*?)\}\}/g);
	for (const [, expression] of expressions) {
		if (!/\bsecrets\b/.test(expression)) continue;
		SECRET_REFERENCE_PATTERN.lastIndex = 0;
		const references = [...expression.matchAll(SECRET_REFERENCE_PATTERN)];
		if (!references.length) {
			failures.push(`${file}: referência a secrets não pôde ser classificada com segurança.`);
			continue;
		}
		for (const [, dotKey, doubleQuotedKey, singleQuotedKey, dynamicKey] of references) {
			const key = dotKey ?? doubleQuotedKey ?? singleQuotedKey;
			if (dynamicKey !== undefined || key !== 'GITHUB_TOKEN') {
				failures.push(`${file}: somente secrets.GITHUB_TOKEN é permitido; referência não autorizada ou dinâmica encontrada.`);
			}
		}
	}
}

export function auditWorkflowSource(source, file = 'workflow.yml') {
	const failures = [];
	let workflow;
	try {
		const document = parseDocument(source, { strict: true, uniqueKeys: true });
		if (document.errors.length) {
			for (const error of document.errors) failures.push(`${file}: YAML inválido (${error.message}).`);
			return failures;
		}
		workflow = document.toJS();
	} catch (error) {
		failures.push(`${file}: YAML inválido (${error.message}).`);
		return failures;
	}

	if (!isPlainObject(workflow)) {
		failures.push(`${file}: workflow YAML deve ter um mapa na raiz.`);
		return failures;
	}
	if (hasPullRequestTargetTrigger(workflow)) {
		failures.push(`${file}: pull_request_target não é permitido neste repositório.`);
	}

	auditPermissions(workflow, file, failures);
	for (const value of collectValuesByKey(workflow, 'uses')) auditActionReference(value, file, failures);
	auditSecrets(workflow, file, failures);

	return failures;
}

export async function auditWorkflowFiles(directory = DEFAULT_DIRECTORY) {
	const files = (await readdir(directory)).filter((file) => /\.ya?ml$/i.test(file)).sort();
	const failures = [];
	if (!files.length) failures.push('Nenhum workflow versionado foi encontrado.');
	for (const file of files) {
		const source = await readFile(`${directory}/${file}`, 'utf8');
		failures.push(...auditWorkflowSource(source, file));
	}
	return { files, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const { files, failures } = await auditWorkflowFiles();
	if (failures.length) {
		for (const failure of failures) console.error('[workflows][FAIL]', failure);
		process.exitCode = 1;
	} else {
		console.log(`[workflows] PASS: ${files.length} workflows, YAML estruturado, permissões mínimas, ações imutáveis, sem PR target e com timeout por job.`);
	}
}
