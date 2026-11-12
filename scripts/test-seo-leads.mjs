import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const paths = {
	home: 'dist/index.html',
	ppcip: 'dist/servicos/projetos-de-combate-a-incendio-e-panico-ppcip/index.html',
	regularizacao: 'dist/servicos/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros/index.html',
	consultoria: 'dist/empresa-combate-incendio-bh/index.html',
	iluminamento: 'dist/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11/index.html',
	esocial: 'dist/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240/index.html',
	medicoes: 'dist/medicoes-ambientais-ocupacionais/index.html',
	ruido: 'dist/blog/medicao-de-ruido-ocupacional-dosimetria-e-planejamento/index.html',
	orcamentoPcmso: 'dist/orcamento-pcmso/index.html',
	consultoriaPgr: 'dist/empresa-que-elabora-pgr/index.html',
	pcmsoService: 'dist/servicos/pcmso-e-asos/index.html',
};

const pages = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, file]) => [key, await readFile(file, 'utf8')])));

function title(html) {
	return html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
}

function metaDescription(html) {
	return html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
}

test('páginas comerciais usam intenção local sem oferecer serviços removidos', () => {
	assert.match(title(pages.home), /Segurança do Trabalho.*(?:BH|Belo Horizonte).*AJN/);
	assert.match(metaDescription(pages.home), /PGR, PCMSO, LTCAT/);
	assert.doesNotMatch(metaDescription(pages.home), /projetos elétricos|elevadores|SPDA/i);

	assert.match(title(pages.ppcip), /PPCIP em Belo Horizonte/);
	assert.match(title(pages.regularizacao), /AVCB e CLCB em Belo Horizonte/);
	assert.notEqual(title(pages.ppcip), title(pages.regularizacao));
	for (const key of ['ppcip', 'regularizacao', 'consultoria']) {
		assert.match(pages[key], /<link rel="canonical" href="https:\/\/ajnengenharia\.com\.br\//);
		assert.match(pages[key], /<meta name="robots" content="index,follow/);
		assert.ok(metaDescription(pages[key]).length > 90, `${key}: descrição precisa informar a oferta`);
	}
});

test('PPCIP e regularização explicam escopo e limites sem promessa de aprovação', () => {
	assert.match(pages.ppcip, /Corpo de Bombeiros Militar de Minas Gerais/);
	assert.match(pages.ppcip, /a emissão do documento dependem/);
	assert.match(pages.regularizacao, /tipo de processo e o documento aplicável/);
	assert.match(pages.regularizacao, /é de responsabilidade do Corpo de Bombeiros/);
	assert.doesNotMatch(pages.regularizacao, /sem burocracia|aprovação garantida/i);
});

test('página de consultoria encaminha às duas ofertas relacionadas', () => {
	assert.match(title(pages.consultoria), /Segurança Contra Incêndio em BH/);
	assert.match(pages.consultoria, /href="\/servicos\/projetos-de-combate-a-incendio-e-panico-ppcip\/"/);
	assert.match(pages.consultoria, /href="\/servicos\/regularizacao-de-imoveis-junto-ao-corpo-de-bombeiros\/"/);
	assert.doesNotMatch(pages.consultoria, /empresa de elevador belo horizonte|total segurança jurídica|aprovação automática garantida/i);
});

test('artigos com impressões no Search Console exibem resumos específicos', () => {
	assert.match(title(pages.iluminamento), /NHO 11: iluminamento no trabalho/);
	assert.match(metaDescription(pages.iluminamento), /luxímetro/);
	assert.match(metaDescription(pages.esocial), /S-2210, S-2220 e S-2240/);
});

test('PCMSO e PGR orientam a contratação sem repetição artificial de palavras-chave', () => {
	assert.match(title(pages.orcamentoPcmso), /Orçamento de PCMSO em Belo Horizonte/);
	assert.match(title(pages.consultoriaPgr), /Consultoria em PGR em Belo Horizonte/);
	for (const key of ['orcamentoPcmso', 'consultoriaPgr']) {
		assert.match(pages[key], /<link rel="canonical" href="https:\/\/ajnengenharia\.com\.br\//);
		assert.match(pages[key], /<meta name="robots" content="index,follow/);
		assert.ok(metaDescription(pages[key]).length > 90, `${key}: descrição deve esclarecer o serviço`);
		assert.match(pages[key], /href="\/contato\/"/);
		assert.doesNotMatch(pages[key], /garantia de aprovação|sem burocracia|preço único garantido/i);
	}
	assert.match(pages.orcamentoPcmso, /profissional médico legalmente habilitado/);
	assert.match(pages.orcamentoPcmso, /href="\/servicos\/pcmso-e-asos\/"/);
	assert.match(pages.pcmsoService, /href="\/orcamento-pcmso\/"/);
	assert.match(pages.consultoriaPgr, /inventário de riscos e plano de ação/i);
	assert.match(pages.consultoriaPgr, /href="\/medicoes-ambientais-ocupacionais\/"/);
});

test('medição de ruído conecta pesquisa informativa à avaliação e ao contato', () => {
	assert.match(title(pages.medicoes), /Medições Ocupacionais em BH/);
	assert.match(metaDescription(pages.medicoes), /dosimetria de ruído/);
	assert.match(pages.medicoes, /id="dosimetria-de-ruido"/);
	assert.match(pages.medicoes, /href="\/blog\/medicao-de-ruido-ocupacional-dosimetria-e-planejamento\/"/);
	assert.match(title(pages.ruido), /Dosimetria de ruído ocupacional/);
	assert.match(pages.ruido, /href="\/medicoes-ambientais-ocupacionais\/#dosimetria-de-ruido"/);
	assert.match(pages.ruido, /href="\/contato\/"/);
});
