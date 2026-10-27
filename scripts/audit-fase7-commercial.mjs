import { readFileSync } from 'node:fs';
import path from 'node:path';

// O layout aplica o keywordMap antes da descrição do arquivo de serviço.
// O teste verifica tanto a fonte quanto o HTML final gerado pelo Astro.
const checks = [
	['assessoria-e-consultoria-em-saude-ocupacional', 'Assessoria em saúde ocupacional para identificar riscos, apoiar programas de prevenção e orientar medidas de controle no ambiente de trabalho.'],
	['gestao-ambiental', 'Gestão ambiental para empresas, com orientação sobre segregação, armazenamento, destinação de resíduos e conscientização das equipes.'],
	['gestao-da-qualidade', 'Gestão da qualidade em obras com plano de qualidade, fichas de verificação, controle de materiais e acompanhamento técnico no local.'],
	['projetos-de-combate-a-incendio-e-panico-ppcip', 'Projetos PPCIP e documentação de segurança contra incêndio e pânico, incluindo regularização e renovação de AVCB/CLCB conforme a edificação.'],
	['regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros', 'Análise da situação da edificação e apoio à elaboração de projetos e documentos para regularização e licenciamento.'],
	['treinamento-de-nrs', 'Capacitações relacionadas às NRs e integração de novos funcionários, conforme atividade, modalidade e requisitos aplicáveis.'],
];

const errors = [];

for (const [slug, expectedDescription] of checks) {
	const sourceFile = path.join('src', 'content', 'services', slug + '.ts');
	const source = readFileSync(sourceFile, 'utf8');
	if (!source.includes(`"description": "${expectedDescription}"`)) {
		errors.push(`${slug}: descrição do serviço diverge do texto canônico`);
	}
	if (source.includes('Saiba mais')) {
		errors.push(`${slug}: descrição truncada herdada ainda presente`);
	}

	const html = readFileSync(path.join('dist', 'servicos', slug, 'index.html'), 'utf8');
	const metaTag = [...html.matchAll(/<meta\b[^>]*>/gi)]
		.map((match) => match[0])
		.find((tag) => /\bname\s*=\s*["']description["']/i.test(tag));
	const actualDescription = metaTag?.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2] ?? '';
	if (actualDescription !== expectedDescription) {
		errors.push(`${slug}: meta description renderizada diverge do texto canônico; recebido ${JSON.stringify(actualDescription)}`);
	}
}

if (errors.length) {
	console.error('[fase7-commercial][FAIL]');
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
} else {
	console.log(`[fase7-commercial] PASS: ${checks.length} descrições confirmadas na fonte e no HTML compilado.`);
}
