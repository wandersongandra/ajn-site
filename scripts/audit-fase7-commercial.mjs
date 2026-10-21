import fs from 'node:fs';

const checks = [
	['src/content/services/assessoria-e-consultoria-em-saude-ocupacional.ts', 'Assessoria em saúde ocupacional para identificar riscos, apoiar programas de prevenção e orientar medidas de controle no ambiente de trabalho.'],
	['src/content/services/gestao-ambiental.ts', 'Gestão ambiental para empresas, com orientação sobre segregação, armazenamento, destinação de resíduos e conscientização das equipes.'],
	['src/content/services/gestao-da-qualidade.ts', 'Gestão da qualidade em obras com plano de qualidade, fichas de verificação, controle de materiais e acompanhamento técnico no local.'],
	['src/content/services/projetos-de-combate-a-incendio-e-panico-ppcip.ts', 'Projetos e documentação de prevenção contra incêndio conforme a edificação e os requisitos da autoridade competente.'],
	['src/content/services/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros.ts', 'Análise da situação da edificação e apoio à elaboração de projetos e documentos para regularização e licenciamento.'],
	['src/content/services/treinamento-de-nrs.ts', 'Capacitações relacionadas às NRs e integração de novos funcionários, conforme atividade, modalidade e requisitos aplicáveis.'],
];

const errors = [];

for (const [file, description] of checks) {
	const source = fs.readFileSync(file, 'utf8');
	if (!source.includes(`"description": "${description}"`)) {
		errors.push(`${file}: descrição canônica ausente`);
	}
	if (source.includes('Saiba mais')) {
		errors.push(`${file}: descrição truncada herdada ainda presente`);
	}
}

if (errors.length > 0) {
	console.error('[fase7-commercial][FAIL]');
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
} else {
	console.log(`[fase7-commercial] PASS: ${checks.length} descrições individuais usam o texto canônico sem truncamento.`);
}
