import { readdir, readFile } from 'node:fs/promises';

const directory = '.github/workflows';
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const files = (await readdir(directory)).filter((file) => /\.ya?ml$/i.test(file)).sort();

check(files.length > 0, 'Nenhum workflow versionado foi encontrado.');
for (const file of files) {
	const path = `${directory}/${file}`;
	const source = await readFile(path, 'utf8');
	check(!/\bpull_request_target\s*:/i.test(source), `${file}: pull_request_target não é permitido neste repositório.`);
	check(/^permissions:\s*\r?\n(?:^[ \t]+.*\r?\n)*?^[ \t]+contents:\s*read\s*$/m.test(source),
		`${file}: permissions global deve limitar contents a read.`);
	check(!/^\s*permissions:\s*write-all\s*$/im.test(source), `${file}: write-all não é permitido.`);
	for (const permission of ['contents', 'actions', 'id-token']) {
		check(!new RegExp(`^\\s*${permission}:\\s*write\\s*$`, 'im').test(source),
			`${file}: ${permission}: write não é permitido sem revisão explícita.`);
	}
	const uses = [...source.matchAll(/^\s*uses:\s*([^\s#]+)@([^\s#]+)/gm)];
	for (const [, action, reference] of uses) {
		check(/^[0-9a-f]{40}$/i.test(reference), `${file}: ação externa ${action} não está fixada em SHA completo.`);
	}
	const jobCount = (source.match(/^\s{2,4}runs-on:\s*/gm) ?? []).length;
	const timeoutCount = (source.match(/^\s{2,4}timeout-minutes:\s*/gm) ?? []).length;
	check(jobCount === timeoutCount, `${file}: cada job precisa de timeout-minutes explícito.`);
	const nonGithubSecrets = source.match(/\$\{\{\s*secrets\.(?!GITHUB_TOKEN\b)[A-Za-z_][A-Za-z0-9_]*\s*\}\}/g) ?? [];
	check(nonGithubSecrets.length === 0, `${file}: secrets externos não são permitidos em workflows de PR.`);
}

if (failures.length) {
	for (const failure of failures) console.error('[workflows][FAIL]', failure);
	process.exitCode = 1;
} else {
	console.log(`[workflows] PASS: ${files.length} workflows, permissões mínimas, ações fixadas em SHA, sem PR target e com timeout por job.`);
}
