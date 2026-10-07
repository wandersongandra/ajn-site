import { validateBlogContent } from '../../content.config';
import { blogLaudoTecnicoDasCondicoesAmbientaisDeTrabalhoLtcat } from './laudo-tecnico-das-condicoes-ambientais-de-trabalho-ltcat';
import { blogLtcatPapelFundamentalNaSegurancaDoTrabalhoENoBemEstarDosColaboradores } from './ltcat-papel-fundamental-na-seguranca-do-trabalho-e-no-bem-estar-dos-colaboradores';
import { blogOrcamentoEficienteParaLtcatPassosEssenciaisParaGarantirASegurancaNoTrabalho } from './orcamento-eficiente-para-ltcat-passos-essenciais-para-garantir-a-seguranca-no-trabalho';
import { blogLtcatESegurancaDoTrabalhoComoGarantirAProtecaoEficazDaSuaEquipe } from './ltcat-e-seguranca-do-trabalho-como-garantir-a-protecao-eficaz-da-sua-equipe';
import { blogLtcatESegurancaDoTrabalhoComoProtegerSuaEmpresaComEficiencia } from './ltcat-e-seguranca-do-trabalho-como-proteger-sua-empresa-com-eficiencia';
import { blogOFimDoPpraEAChegadaDoPgrOQueMudou } from './o-fim-do-ppra-e-a-chegada-do-pgr-o-que-mudou';
import { blogLtcatGuiaEssencialParaGarantirASegurancaNoAmbienteDeTrabalho } from './ltcat-guia-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho';
import { blogPppFacilOUeEComoConsultarESuaImportancia } from './ppp-facil-o-ue-e-como-consultar-e-sua-importancia';
import { blogSegurancaDoTrabalhoEPcmsoGestaoDaSaudeOcupacional } from './seguranca-do-trabalho-e-pcmso-gestao-da-saude-ocupacional';
import { blogLaudoDeGerenciamentoDeRiscosEssencialParaGarantirASegurancaNoAmbienteDeTrabalho } from './laudo-de-gerenciamento-de-riscos-essencial-para-garantir-a-seguranca-no-ambiente-de-trabalho';
import { blogLtcatNaSegurancaDoTrabalhoFortalecaAProtecaoDosSeusFuncionariosEficazmente } from './ltcat-na-seguranca-do-trabalho-fortaleca-a-protecao-dos-seus-funcionarios-eficazmente';
import { blogSegurancaDoTrabalhoELtcatConformidadeEProtecaoPrevidenciaria } from './seguranca-do-trabalho-e-ltcat-conformidade-e-protecao-previdenciaria';
import { blogLtcatGuiaEssencialParaGarantirSegurancaDoTrabalhoEficaz } from './ltcat-guia-essencial-para-garantir-seguranca-do-trabalho-eficaz';
import { blogUmPoucoSobreNos } from './um-pouco-sobre-nos';
import { blogPerfilProfissiograficoPrevidenciarioPpp } from './perfil-profissiografico-previdenciario-ppp';

export const blogPages = [
	validateBlogContent(blogLaudoTecnicoDasCondicoesAmbientaisDeTrabalhoLtcat),
	validateBlogContent(blogLtcatPapelFundamentalNaSegurancaDoTrabalhoENoBemEstarDosColaboradores),
	validateBlogContent(blogOrcamentoEficienteParaLtcatPassosEssenciaisParaGarantirASegurancaNoTrabalho),
	validateBlogContent(blogLtcatESegurancaDoTrabalhoComoGarantirAProtecaoEficazDaSuaEquipe),
	validateBlogContent(blogLtcatESegurancaDoTrabalhoComoProtegerSuaEmpresaComEficiencia),
	validateBlogContent(blogOFimDoPpraEAChegadaDoPgrOQueMudou),
	validateBlogContent(blogLtcatGuiaEssencialParaGarantirASegurancaNoAmbienteDeTrabalho),
	validateBlogContent(blogPppFacilOUeEComoConsultarESuaImportancia),
	validateBlogContent(blogSegurancaDoTrabalhoEPcmsoGestaoDaSaudeOcupacional),
	validateBlogContent(blogLaudoDeGerenciamentoDeRiscosEssencialParaGarantirASegurancaNoAmbienteDeTrabalho),
	validateBlogContent(blogLtcatNaSegurancaDoTrabalhoFortalecaAProtecaoDosSeusFuncionariosEficazmente),
	validateBlogContent(blogSegurancaDoTrabalhoELtcatConformidadeEProtecaoPrevidenciaria),
	validateBlogContent(blogLtcatGuiaEssencialParaGarantirSegurancaDoTrabalhoEficaz),
	validateBlogContent(blogUmPoucoSobreNos),
	validateBlogContent(blogPerfilProfissiograficoPrevidenciarioPpp),
] as const;
