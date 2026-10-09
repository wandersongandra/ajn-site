export type ServiceGroupKey = 'sst' | 'operations' | 'engineering';

export interface ServiceIndexItem {
	title: string;
	description: string;
	href: string;
	image: string;
	group: ServiceGroupKey;
}

export const serviceGroups: readonly { key: ServiceGroupKey; title: string; description: string }[] = [
	{ key: 'sst', title: 'Segurança e saúde ocupacional', description: 'Consultoria, programas, avaliações técnicas e organização das informações de SST.' },
	{ key: 'operations', title: 'Treinamentos e operação', description: 'Capacitação e apoio técnico às rotinas de campo, mobilização e acompanhamento de atividades.' },
	{ key: 'engineering', title: 'Engenharia, ambiente e qualidade', description: 'Projetos, regularização e suporte a requisitos ambientais e de qualidade conforme cada escopo.' },
];

export const serviceIndexItems: readonly ServiceIndexItem[] = [
	{ group: 'sst', title: 'Assessoria e consultoria em saúde ocupacional', description: 'Identificação de perigos, avaliação de riscos e orientação sobre medidas de prevenção nas atividades da empresa.', href: '/servicos/assessoria-e-consultoria-em-saude-ocupacional', image: '/images/acervo-ajn/sst/vistoria-canteiro.webp' },
	{ group: 'sst', title: 'Elaboração de PGR', description: 'Inventário de riscos e plano de ação organizados a partir das atividades e condições reais de trabalho.', href: '/elaboracao-pgr', image: '/images/content/marketing/elaboracao-pgr/elaboracao-pgr-02.webp' },
	{ group: 'sst', title: 'Emissão de LTCAT', description: 'Documento previdenciário baseado na caracterização técnica dos ambientes, atividades e exposições ocupacionais.', href: '/emissao-ltcat', image: '/images/content/marketing/empresa-que-faz-ltcat/empresa-que-faz-ltcat-01.webp' },
	{ group: 'sst', title: 'Gestão do eSocial SST', description: 'Organização de informações e apoio aos eventos S-2210, S-2220 e S-2240, sem substituir os documentos de origem.', href: '/servicos/gestao-do-e-social', image: '/images/acervo-ajn/institucional/profissional-conferindo-documentos.webp' },
	{ group: 'sst', title: 'PCMSO e ASOs', description: 'Acompanhamento documental do PCMSO e organização dos exames e atestados ocupacionais, preservado o acesso clínico restrito.', href: '/servicos/pcmso-e-asos', image: '/images/content/services/pcmso-e-asos.jpg' },
	{ group: 'sst', title: 'Perícias em periculosidade e insalubridade', description: 'Avaliações técnicas das condições de exposição para subsidiar laudos e perícias conforme o escopo aplicável.', href: '/servicos/pericias-em-periculosidade-e-insalubridade', image: '/images/acervo-ajn/sst/equipe-epi-area-escavada.webp' },
	{ group: 'operations', title: 'Treinamento de Normas Regulamentadoras', description: 'Capacitações relacionadas às NRs e integração de novos funcionários, conforme atividade, modalidade e requisitos aplicáveis.', href: '/servicos/treinamento-de-nrs', image: '/images/acervo-ajn/treinamento/turma-em-sala-hemarcon.webp' },
	{ group: 'operations', title: 'Mobilização e acompanhamento técnico', description: 'Apoio à mobilização de equipes e equipamentos, organização documental, inspeções e acompanhamento técnico em campo conforme contrato.', href: '/mobilizacao-pessoal-equipamentos', image: '/images/acervo-ajn/institucional/equipe-obra-epi.webp' },
	{ group: 'engineering', title: 'Gestão ambiental', description: 'Apoio à organização de resíduos e a procedimentos ambientais definidos conforme as necessidades de cada operação.', href: '/servicos/gestao-ambiental', image: '/images/acervo-ajn/meio-ambiente/residuos-canteiro.webp' },
	{ group: 'engineering', title: 'Gestão da qualidade', description: 'Planejamento, registros e acompanhamento de requisitos de qualidade em obras e serviços contratados; não inclui certificação.', href: '/servicos/gestao-da-qualidade', image: '/images/acervo-ajn/obras/formas-e-fundacao.webp' },
	{ group: 'engineering', title: 'Projetos de combate a incêndio e pânico — PPCIP', description: 'Projetos e documentação de prevenção contra incêndio conforme a edificação e os requisitos da autoridade competente.', href: '/servicos/projetos-de-combate-a-incendio-e-panico-ppcip', image: '/images/acervo-ajn/incendio/hidrante-industrial.webp' },
	{ group: 'engineering', title: 'Projetos elétricos residenciais, comerciais e prediais', description: 'Projetos elétricos para diferentes tipos de edificação, com escopo e documentação técnica definidos para cada demanda.', href: '/projetos-eletricos-prediais', image: '/images/acervo-ajn/engenharia/trabalho-rede-eletrica.webp' },
	{ group: 'engineering', title: 'Regularização de imóveis junto ao Corpo de Bombeiros', description: 'Análise da situação da edificação e apoio à elaboração de projetos e documentos para regularização e licenciamento.', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros', image: '/images/acervo-ajn/incendio/hidrante-industrial.webp' },
] as const;

export const serviceIndexGroups = serviceGroups.map((group) => ({
	...group,
	services: serviceIndexItems.filter((service) => service.group === group.key),
}));
