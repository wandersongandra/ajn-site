import { consultoriaDaQualidade } from './consultoria-da-qualidade';
import { consultoriaPcmso } from './consultoria-pcmso';
import { combateIncendioBeloHorizonte } from './combate-incendio-belo-horizonte';
import { empresaEscadaRolante } from './empresa-escada-rolante';
import { escadaRolante } from './escada-rolante';
import { empresaElevadorBeloHorizonte } from './empresa-elevador-belo-horizonte';
import { empresaQueElaboraPgr } from './empresa-que-elabora-pgr';
import { elaboracaoPgrPcmso } from './elaboracao-pgr-pcmso';
import { laudosSegurancaDoTrabalho } from './laudos-seguranca-do-trabalho';
import { laudoLtcatInsalubridade } from './laudo-ltcat-insalubridade';
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
import { projetoSistemaCombateIncendio } from './projeto-sistema-combate-incendio';
import { projetoSistemaIncendio } from './projeto-sistema-incendio';
import { empresasElevadoresBh } from './empresas-elevadores-bh';
import { projetosEngenhariaEletrica } from './projetos-engenharia-eletrica';
import { instalacoesEletricasProjeto } from './instalacoes-eletricas-projeto';
import { inspecoesSegurancaDoTrabalho } from './inspecoes-seguranca-do-trabalho';
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
	validateMarketingContent(inspecoesSegurancaDoTrabalho),
	validateMarketingContent(laudoLtcatInsalubridade),
	validateMarketingContent(empresaEscadaRolante),
	validateMarketingContent(projetoSistemaCombateIncendio),
	validateMarketingContent(empresasElevadoresBh),
	validateMarketingContent(projetoSistemaIncendio),
	validateMarketingContent(combateIncendioBeloHorizonte),
	validateMarketingContent(projetosEngenhariaEletrica),
	validateMarketingContent(instalacoesEletricasProjeto),
	validateMarketingContent(escadaRolante),
] as const;
