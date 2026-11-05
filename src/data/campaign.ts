import { site } from './home';

/**
 * Faixa da Black Friday AJN.
 * Para encerrar a campanha, mude BLACK_FRIDAY_ACTIVE para false e gere o site de novo.
 * A faixa some do HTML; não há preço, percentual de desconto nem mudança de deploy.
 */
export const BLACK_FRIDAY_ACTIVE = true;

const CAMPAIGN_MESSAGE = 'Olá! Vim pela Black Friday AJN e quero um orçamento.';

/** Reusa o número já publicado em site.phoneHref. Não introduz outro WhatsApp. */
function campaignWhatsappHref(message: string): string {
	const phone = new URL(site.phoneHref).pathname.replace(/^\/+/, '');
	if (!/^\d{10,15}$/.test(phone)) return site.phoneHref;
	return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const blackFriday = {
	label: 'BLACK FRIDAY AJN',
	line: 'Condições especiais em SST, treinamentos NR, PGR/PCMSO, eSocial, laudos e PPCIP. Sob consulta.',
	cta: 'Solicitar atendimento',
	href: campaignWhatsappHref(CAMPAIGN_MESSAGE),
} as const;
