import { consultoriaDaQualidade } from './consultoria-da-qualidade';
import { empresaElevadorBeloHorizonte } from './empresa-elevador-belo-horizonte';
import { empresaQueElaboraPgr } from './empresa-que-elabora-pgr';
import { elaboracaoPgrPcmso } from './elaboracao-pgr-pcmso';
import { laudosSegurancaDoTrabalho } from './laudos-seguranca-do-trabalho';
import { validateMarketingContent } from '../../content.config';
import { marketingDetailPage } from './emissao-laudos';
import { periciasInsalubridadePericulosidade } from './pericias-insalubridade-periculosidade';
import { projetoSegurancaIncendioPanico } from './projeto-seguranca-incendio-panico';
import { projetoEletricoIndustrialPreco } from './projeto-eletrico-industrial-preco';
import { sistemasIncendioBh } from './sistemas-incendio-bh';

export const marketingPages = [
	validateMarketingContent(marketingDetailPage),
	validateMarketingContent(projetoSegurancaIncendioPanico),
	validateMarketingContent(laudosSegurancaDoTrabalho),
	validateMarketingContent(sistemasIncendioBh),
	validateMarketingContent(empresaElevadorBeloHorizonte),
	validateMarketingContent(projetoEletricoIndustrialPreco),
	validateMarketingContent(consultoriaDaQualidade),
	validateMarketingContent(elaboracaoPgrPcmso),
	validateMarketingContent(periciasInsalubridadePericulosidade),
	validateMarketingContent(empresaQueElaboraPgr),
] as const;
