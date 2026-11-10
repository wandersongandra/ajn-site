import type { MarketingContent } from '../types';

export const consultoriaPcmso = {
	slug: 'consultoria-pcmso',
	path: '/consultoria-pcmso',
	title: 'Consultoria em PCMSO e Saúde Ocupacional (NR-07) | AJN',
	description: 'Consultoria em PCMSO em Belo Horizonte e MG: revisão de grade de exames, integração com o PGR, conformidade na NR-07 e apoio para auditorias e eSocial.',
	heading: 'Consultoria em PCMSO e Gestão da NR-07',
	images: [
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-01.webp', alt: 'Consultoria em PCMSO para empresas' },
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-02.webp', alt: 'Análise de compatibilidade entre PGR e PCMSO' },
		{ src: '/images/content/marketing/consultoria-pcmso/consultoria-pcmso-03.webp', alt: 'Gestão documental de saúde ocupacional' },
	],
	sections: [
		{
			heading: 'Quando contratar uma consultoria especializada em PCMSO',
			paragraphs: [
				'Muitas empresas já possuem um PCMSO emitido, mas enfrentam problemas práticos: grades de exames desatualizadas após mudanças na NR-07, cobrança de exames complementares sem relação com o inventário de riscos do PGR ou rejeições documentais ao mobilizar equipes em clientes.',
				'A consultoria em PCMSO da AJN Consultoria e Engenharia audita e reestrutura o programa para que ele reflita exatamente as exposições ocupacionais de cada setor e função.',
			],
		},
		{
			heading: 'Pontos corrigidos pela consultoria técnica',
			paragraphs: [
				'Nosso trabalho revisa os principais gargalos entre a engenharia de segurança e a medicina ocupacional:',
			],
			lists: [
				{
					items: [
						'Compatibilização de nomenclatura de cargos, CBOs, setores e Grupos Homogêneos de Exposição (GHE) entre PGR, LTCAT e PCMSO;',
						'Revisão técnica dos exames complementares exigidos pelos Anexos I a V da NR-07 conforme os níveis de ação e limites de tolerância;',
						'Estruturação do controle de vencimentos de ASOs e definição de fluxos para mudança de riscos ocupacionais e retorno ao trabalho;',
						'Conferência das informações enviadas nos eventos S-2220 e S-2240 do eSocial.',
					],
				},
			],
		},
		{
			heading: 'Atuação conjunta em Belo Horizonte e Minas Gerais',
			paragraphs: [
				'Ao unificar o suporte técnico na AJN, qualquer atualização no inventário de riscos do PGR é comunicada diretamente para revisão do PCMSO, mantendo os documentos sincronizados durante todo o ano.',
				{
					segments: [
						'Acesse também nossas páginas sobre ',
						{ text: 'PCMSO e ASOs', href: '/servicos/pcmso-e-asos' },
						' e ',
						{ text: 'Elaboração de PGR e PCMSO', href: '/elaboracao-pgr-pcmso' },
						'.',
					],
				},
			],
		},
		{
			heading: 'Fale com a AJN para avaliar o PCMSO da sua empresa',
			paragraphs: [
				'Informe o porte da sua operação e a sua necessidade atual para agendarmos uma análise técnica.',
				{
					segments: [
						'Ligue para ',
						{ bold: true, text: '31 98473-4644' },
						' ou ',
						{ text: 'solicite contato pelo formulário', href: '/contato' },
						'.',
					],
				},
			],
		},
	],
} as const satisfies MarketingContent;
