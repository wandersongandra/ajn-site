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
import { projetosEletricosOrcamento } from './projetos-eletricos-orcamento';
import { escadaRolanteBeloHorizonte } from './escada-rolante-belo-horizonte';
import { valorProjetoIncendio } from './valor-projeto-incendio';
import { plataformaElevatoria } from './plataforma-elevatoria';
import { projetosInstalacoesEletricasPrediais } from './projetos-instalacoes-eletricas-prediais';
import { ltcatPreco } from './ltcat-preco';
import { empresaCombateIncendioBh } from './empresa-combate-incendio-bh';
import { servicoProjetoEletrico } from './servico-projeto-eletrico';
import { orcamentoPgr } from './orcamento-pgr';
import { ltcatRenovacao } from './ltcat-renovacao';
import { empresasManutencaoElevadoresBh } from './empresas-manutencao-elevadores-bh';
import { orcamentoProjetoEletrico } from './orcamento-projeto-eletrico';
import { empresaCombateIncendio } from './empresa-combate-incendio';
import { empresaQueFazPgr } from './empresa-que-faz-pgr';
import { segurancaDoTrabalhoLtcat } from './seguranca-do-trabalho-ltcat';
import { projetoEletricoIndustrial } from './projeto-eletrico-industrial';
import { elevacaoVertical } from './elevacao-vertical';
import { projetosEletricosPrediais } from './projetos-eletricos-prediais';
import { precoProjetosEletricos } from './preco-projetos-eletricos';
import { projetoEletricoPreco } from './projeto-eletrico-preco';
import { valorElaboracaoPgr } from './valor-elaboracao-pgr';
import { plataformaElevatoriaBeloHorizonte } from './plataforma-elevatoria-belo-horizonte';
import { segurancaDoTrabalhoPcmso } from './seguranca-do-trabalho-pcmso';
import { elevadorBh } from './elevador-bh';
import { elaboracaoPgr } from './elaboracao-pgr';
import { valorProjetoCombateIncendio } from './valor-projeto-combate-incendio';
import { projetoDeteccaoIncendio } from './projeto-deteccao-incendio';
import { mobilizacaoPessoalEquipamentos } from './mobilizacao-pessoal-equipamentos';
import { plataformaElevatoriaPreco } from './plataforma-elevatoria-preco';
import { valorFazerLtcat } from './valor-fazer-ltcat';
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
	validateMarketingContent(projetosEletricosOrcamento),
	validateMarketingContent(escadaRolanteBeloHorizonte),
	validateMarketingContent(valorProjetoIncendio),
	validateMarketingContent(plataformaElevatoria),
	validateMarketingContent(projetosInstalacoesEletricasPrediais),
	validateMarketingContent(ltcatPreco),
	validateMarketingContent(empresaCombateIncendioBh),
	validateMarketingContent(servicoProjetoEletrico),
	validateMarketingContent(orcamentoPgr),
	validateMarketingContent(ltcatRenovacao),
	validateMarketingContent(empresasManutencaoElevadoresBh),
	validateMarketingContent(orcamentoProjetoEletrico),
	validateMarketingContent(empresaCombateIncendio),
	validateMarketingContent(empresaQueFazPgr),
	validateMarketingContent(segurancaDoTrabalhoLtcat),
	validateMarketingContent(projetoEletricoIndustrial),
	validateMarketingContent(elevacaoVertical),
	validateMarketingContent(projetosEletricosPrediais),
	validateMarketingContent(precoProjetosEletricos),
	validateMarketingContent(projetoEletricoPreco),
	validateMarketingContent(valorElaboracaoPgr),
	validateMarketingContent(plataformaElevatoriaBeloHorizonte),
	validateMarketingContent(segurancaDoTrabalhoPcmso),
	validateMarketingContent(elevadorBh),
	validateMarketingContent(elaboracaoPgr),
	validateMarketingContent(valorProjetoCombateIncendio),
	validateMarketingContent(projetoDeteccaoIncendio),
	validateMarketingContent(mobilizacaoPessoalEquipamentos),
	validateMarketingContent(plataformaElevatoriaPreco),
	validateMarketingContent(valorFazerLtcat),
] as const;
