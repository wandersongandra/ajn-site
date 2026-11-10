import type { MarketingContent } from '../types';

export const projetoPrevencaoIncendioPanico = {
	slug: 'projeto-prevencao-incendio-panico',
	path: '/projeto-prevencao-incendio-panico',
	title: 'Projeto de Prevenção Contra Incêndio e Pânico (PSCIP) | AJN',
	description: 'Elaboração de projeto de prevenção contra incêndio e pânico (PSCIP) em BH e MG. Dimensionamento de rotas de fuga, iluminação, alarme, hidrantes e aprovação no CBMMG.',
	heading: 'Projeto de Prevenção Contra Incêndio e Pânico',
	images: [
		{ src: '/images/content/marketing/projeto-prevencao-incendio-panico/projeto-prevencao-incendio-panico-01.webp', alt: 'Projeto de prevenção contra incêndio e pânico' },
		{ src: '/images/content/marketing/projeto-prevencao-incendio-panico/projeto-prevencao-incendio-panico-02.webp', alt: 'Plantas técnicas de rotas de fuga e combate a incêndio' },
		{ src: '/images/content/marketing/projeto-prevencao-incendio-panico/projeto-prevencao-incendio-panico-03.webp', alt: 'Equipamentos preventivos dimensionados conforme CBMMG' },
	],
	sections: [
		{
			heading: 'Foco na evacuação segura e na prevenção de sinistros',
			paragraphs: [
				'Em locais com circulação de colaboradores, moradores ou público externo, o Projeto de Prevenção Contra Incêndio e Pânico (PSCIP) garante que todas as pessoas consigam abandonar a edificação em tempo hábil caso ocorra princípio de incêndio ou falha elétrica.',
				'A AJN Consultoria e Engenharia elabora o projeto completo em Belo Horizonte e Minas Gerais observando rigorosamente os parâmetros da legislação estadual e das Instruções Técnicas do CBMMG.',
			],
		},
		{
			heading: 'Elementos técnicos detalhados nas pranchas do projeto',
			paragraphs: [
				'Para aprovação sem ressalvas no Corpo de Bombeiros e orientação clara dos instaladores em obra, o projeto especifica:',
			],
			lists: [
				{
					items: [
						'Cálculo da população por pavimento com base nos coeficientes de ocupação da IT 08 do CBMMG;',
						'Dimensionamento de acessos, descargas, escadas comuns ou enclausuradas, guarda-corpos e corrimãos;',
						'Posicionamento e autonomia do sistema de iluminação de emergência (aclaramento e balizamento) e placas fotoluminescentes com sentido de rota de fuga;',
						'Localização de acionadores manuais, sirenes audiovisuais, detectores de fumaça, extintores e pontos de hidrantes;',
						'Acesso de viaturas do Corpo de Bombeiros na fachada e localização do registro de recalque no passeio.',
					],
				},
			],
		},
		{
			heading: 'Regularização completa junto ao Corpo de Bombeiros',
			paragraphs: [
				'Se o seu imóvel foi notificado em fiscalização ou precisa do AVCB para liberação de alvará municipal, nossa equipe realiza o diagnóstico in loco das pendências existentes e conduz tanto a aprovação do projeto quanto o acompanhamento para vistoria final.',
				{
					segments: [
						'Veja também nossa página sobre ',
						{ text: 'Regularização de Imóveis junto ao Corpo de Bombeiros', href: '/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Peça seu orçamento de projeto à AJN',
			paragraphs: [
				'Informe a localização, a área construída e o uso da edificação para nossa equipe de engenharia preparar uma proposta.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'fale conosco pelo formulário de contato', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
