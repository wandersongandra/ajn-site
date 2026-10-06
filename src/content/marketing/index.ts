import { consultoriaDaQualidade } from './consultoria-da-qualidade';
import { consultoriaPcmso } from './consultoria-pcmso';
import { empresaElevadorBeloHorizonte } from './empresa-elevador-belo-horizonte';
import { empresaQueElaboraPgr } from './empresa-que-elabora-pgr';
import { elaboracaoPgrPcmso } from './elaboracao-pgr-pcmso';
import { laudosSegurancaDoTrabalho } from './laudos-seguranca-do-trabalho';
import { validateMarketingContent } from '../../content.config';
import { marketingDetailPage } from './emissao-laudos';
import { periciasInsalubridadePericulosidade } from './pericias-insalubridade-periculosidade';
import { pcmsoPreco } from './pcmso-preco';
import { instalacaoPredialEletrica } from './instalacao-predial-eletrica';
import { projetoEletricoResidencialBeloHorizonte } from './projeto-eletrico-residencial-belo-horizonte';
import { projetoInstalacaoEletricaResidencial } from './projeto-instalacao-eletrica-residencial';
import { projetoSegurancaIncendioPanico } from './projeto-seguranca-incendio-panico';
import { projetoEletricoIndustrialPreco } from './projeto-eletrico-industrial-preco';
import { projetoEletricoComercial } from './projeto-eletrico-comercial';
import { projetoEletricoResidencialOrcamento } from './projeto-eletrico-residencial-orcamento';
import { analiseProjetosEletricosBh } from './analise-projetos-eletricos-bh';
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
	validateMarketingContent(projetoInstalacaoEletricaResidencial),
	validateMarketingContent(instalacaoPredialEletrica),
	validateMarketingContent(projetoEletricoResidencialBeloHorizonte),
	validateMarketingContent(projetoEletricoResidencialOrcamento),
	validateMarketingContent(analiseProjetosEletricosBh),
	validateMarketingContent(projetoEletricoComercial),
	validateMarketingContent(consultoriaPcmso),
	validateMarketingContent(pcmsoPreco),
] as const;
