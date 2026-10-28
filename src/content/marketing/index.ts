import { consultoriaDaQualidade } from './consultoria-da-qualidade';
import { consultoriaPcmso } from './consultoria-pcmso';
import { combateIncendioBeloHorizonte } from './combate-incendio-belo-horizonte';
import { empresaQueElaboraPgr } from './empresa-que-elabora-pgr';
import { elaboracaoPgrPcmso } from './elaboracao-pgr-pcmso';
import { laudosSegurancaDoTrabalho } from './laudos-seguranca-do-trabalho';
import { laudoLtcatInsalubridade } from './laudo-ltcat-insalubridade';
import { validateMarketingContent } from '../../content.config';
import { laudosSst } from './laudos-sst';
import { emissaoLtcat } from './emissao-ltcat';
import { empresaPcmso } from './empresa-pcmso';
import { inspecaoSegurancaSaudeNoAmbienteTrabalho } from './inspecao-seguranca-saude-no-ambiente-trabalho';
import { servicosPcmso } from './servicos-pcmso';
import { laudosSaudeSegurancaDoTrabalho } from './laudos-saude-seguranca-do-trabalho';
import { orcamentoPcmso } from './orcamento-pcmso';
import { precoPcmso } from './preco-pcmso';
import { laudoPgr } from './laudo-pgr';
import { pcmsoProgramaControleMedicoSaudeOcupacional } from './pcmso-programa-controle-medico-saude-ocupacional';
import { ltcatOrcamento } from './ltcat-orcamento';
import { projetoCombateIncendioPanico } from './projeto-combate-incendio-panico';
import { orcamentoLtcat } from './orcamento-ltcat';
import { projetoIncendio } from './projeto-incendio';
import { consultoriaSegurancaDoTrabalho } from './consultoria-seguranca-do-trabalho';
import { elaboracaoProjetoCombateIncendio } from './elaboracao-projeto-combate-incendio';
import { projetoProtecaoIncendio } from './projeto-protecao-incendio';
import { elaboracaoPcmso } from './elaboracao-pcmso';
import { empresaQueFazPcmso } from './empresa-que-faz-pcmso';
import { laudosSegurancaDoTrabalhoEsocial } from './laudos-seguranca-do-trabalho-esocial';
import { projetoProtecaoIncendioPanico } from './projeto-protecao-incendio-panico';
import { projetoSegurancaIncendio } from './projeto-seguranca-incendio';
import { empresaLtcat } from './empresa-ltcat';
import { projetoCombateIncendioPreco } from './projeto-combate-incendio-preco';
import { projetoPrevencaoIncendioPanico } from './projeto-prevencao-incendio-panico';
import { empresaQueFazLtcat } from './empresa-que-faz-ltcat';
import { orcamentoProjetoCombateIncendio } from './orcamento-projeto-combate-incendio';
import { ltcatEventoEsocial } from './ltcat-evento-esocial';
import { projetoPrevencaoCombateIncendio } from './projeto-prevencao-combate-incendio';
import { elaboracaoDoPgrPcmso } from './elaboracao-do-pgr-pcmso';
import { consultoriaSegurancaSaudeNoTrabalho } from './consultoria-seguranca-saude-no-trabalho';
import { marketingDetailPage } from './emissao-laudos';
import { periciasInsalubridadePericulosidade } from './pericias-insalubridade-periculosidade';
import { pcmsoPreco } from './pcmso-preco';
import { projetoSegurancaIncendioPanico } from './projeto-seguranca-incendio-panico';
import { projetoSistemaCombateIncendio } from './projeto-sistema-combate-incendio';
import { projetoSistemaIncendio } from './projeto-sistema-incendio';
import { inspecoesSegurancaDoTrabalho } from './inspecoes-seguranca-do-trabalho';
import { valorProjetoIncendio } from './valor-projeto-incendio';
import { ltcatPreco } from './ltcat-preco';
import { empresaCombateIncendioBh } from './empresa-combate-incendio-bh';
import { orcamentoPgr } from './orcamento-pgr';
import { ltcatRenovacao } from './ltcat-renovacao';
import { empresaCombateIncendio } from './empresa-combate-incendio';
import { empresaQueFazPgr } from './empresa-que-faz-pgr';
import { segurancaDoTrabalhoLtcat } from './seguranca-do-trabalho-ltcat';
import { valorElaboracaoPgr } from './valor-elaboracao-pgr';
import { segurancaDoTrabalhoPcmso } from './seguranca-do-trabalho-pcmso';
import { elaboracaoPgr } from './elaboracao-pgr';
import { valorProjetoCombateIncendio } from './valor-projeto-combate-incendio';
import { projetoDeteccaoIncendio } from './projeto-deteccao-incendio';
import { mobilizacaoPessoalEquipamentos } from './mobilizacao-pessoal-equipamentos';
import { valorFazerLtcat } from './valor-fazer-ltcat';
import { sistemasIncendioBh } from './sistemas-incendio-bh';

export const marketingPages = [
	validateMarketingContent(marketingDetailPage),
	validateMarketingContent(projetoSegurancaIncendioPanico),
	validateMarketingContent(laudosSegurancaDoTrabalho),
	validateMarketingContent(sistemasIncendioBh),
	validateMarketingContent(laudosSst),
	validateMarketingContent(emissaoLtcat),
	validateMarketingContent(empresaPcmso),
	validateMarketingContent(inspecaoSegurancaSaudeNoAmbienteTrabalho),
	validateMarketingContent(servicosPcmso),
	validateMarketingContent(laudosSaudeSegurancaDoTrabalho),
	validateMarketingContent(orcamentoPcmso),
	validateMarketingContent(precoPcmso),
	validateMarketingContent(laudoPgr),
	validateMarketingContent(pcmsoProgramaControleMedicoSaudeOcupacional),
	validateMarketingContent(ltcatOrcamento),
	validateMarketingContent(projetoCombateIncendioPanico),
	validateMarketingContent(orcamentoLtcat),
	validateMarketingContent(projetoIncendio),
	validateMarketingContent(consultoriaSegurancaDoTrabalho),
	validateMarketingContent(elaboracaoProjetoCombateIncendio),
	validateMarketingContent(projetoProtecaoIncendio),
	validateMarketingContent(elaboracaoPcmso),
	validateMarketingContent(empresaQueFazPcmso),
	validateMarketingContent(laudosSegurancaDoTrabalhoEsocial),
	validateMarketingContent(projetoProtecaoIncendioPanico),
	validateMarketingContent(projetoSegurancaIncendio),
	validateMarketingContent(empresaLtcat),
	validateMarketingContent(projetoCombateIncendioPreco),
	validateMarketingContent(projetoPrevencaoIncendioPanico),
	validateMarketingContent(empresaQueFazLtcat),
	validateMarketingContent(orcamentoProjetoCombateIncendio),
	validateMarketingContent(ltcatEventoEsocial),
	validateMarketingContent(projetoPrevencaoCombateIncendio),
	validateMarketingContent(elaboracaoDoPgrPcmso),
	validateMarketingContent(consultoriaSegurancaSaudeNoTrabalho),
	validateMarketingContent(consultoriaDaQualidade),
	validateMarketingContent(elaboracaoPgrPcmso),
	validateMarketingContent(periciasInsalubridadePericulosidade),
	validateMarketingContent(empresaQueElaboraPgr),
	validateMarketingContent(consultoriaPcmso),
	validateMarketingContent(pcmsoPreco),
	validateMarketingContent(inspecoesSegurancaDoTrabalho),
	validateMarketingContent(laudoLtcatInsalubridade),
	validateMarketingContent(projetoSistemaCombateIncendio),
	validateMarketingContent(projetoSistemaIncendio),
	validateMarketingContent(combateIncendioBeloHorizonte),
	validateMarketingContent(valorProjetoIncendio),
	validateMarketingContent(ltcatPreco),
	validateMarketingContent(empresaCombateIncendioBh),
	validateMarketingContent(orcamentoPgr),
	validateMarketingContent(ltcatRenovacao),
	validateMarketingContent(empresaCombateIncendio),
	validateMarketingContent(empresaQueFazPgr),
	validateMarketingContent(segurancaDoTrabalhoLtcat),
	validateMarketingContent(valorElaboracaoPgr),
	validateMarketingContent(segurancaDoTrabalhoPcmso),
	validateMarketingContent(elaboracaoPgr),
	validateMarketingContent(valorProjetoCombateIncendio),
	validateMarketingContent(projetoDeteccaoIncendio),
	validateMarketingContent(mobilizacaoPessoalEquipamentos),
	validateMarketingContent(valorFazerLtcat),
] as const;
