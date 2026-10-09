// Verifica a experiência do catálogo e o peso dos recursos já gerados pelo Astro.
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const [html, css, js, catalogSource, componentSource, globalCss] = await Promise.all([
  readFile('dist/servicos/index.html', 'utf8'),
  readFile('src/styles/services-catalog.css', 'utf8'),
  readFile('public/scripts/services-index.js', 'utf8'),
  readFile('src/content/services/catalog.ts', 'utf8'),
  readFile('src/components/ServicesIndexPage.astro', 'utf8'),
  readFile('src/styles/global.css', 'utf8'),
]);
const failures = [];
const check = (condition, detail) => { if (!condition) failures.push(detail); };
// Mantenibilidade: o mesmo item contém título, descrição, URL e imagem.
// Evita lookup por texto exibido, código redundante e arquivos de estilo órfãos.
const catalogImages = [...catalogSource.matchAll(/\bimage:\s*'([^']+)'/g)].map(match => match[1]);
check(catalogImages.length === 13, `Catálogo: esperadas 13 imagens definidas no próprio dado, encontradas ${catalogImages.length}.`);
check(new Set(catalogImages).size === 13, 'Catálogo: recursos de imagem repetidos.');
check(componentSource.includes('src={service.image}') && !componentSource.includes('serviceImages['),
  'O componente deve usar imagem do objeto de serviço, sem lookup por título.');
check(!globalCss.includes('/* Services index */') && !globalCss.includes('/* Catálogo de serviços — leitura e pesquisa'),
  'Estilos de catálogo antigos não devem voltar para global.css.');
const cards = [...html.matchAll(/<article\b[^>]*data-service-card\b[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]);

check(cards.length === 13, `Deveria haver 13 cartões de serviço; encontrados ${cards.length}.`);
check((html.match(/data-service-group\b/g) ?? []).length === 3, 'Catálogo deve agrupar os serviços em três áreas de atendimento.');
check(html.includes('aria-label="Laudos e programas mais procurados"'), 'Links para PGR e LTCAT ausentes.');
check(html.includes('href="/elaboracao-pgr"') && html.includes('href="/emissao-ltcat"'), 'Acesso direto a PGR/LTCAT ausente.');
check(html.includes('data-service-results') && html.includes('role="status"'), 'Contador acessível ausente.');
check(html.includes('aria-controls="service-catalog-grid"'), 'Campo de pesquisa não vinculado ao grid.');
check(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), 'Grade desktop não configurada.');
check(css.includes('max-width: 700px') && css.includes('max-width: 540px'), 'Responsividade mobile não prevista.');
check(css.includes('prefers-reduced-motion: reduce'), 'O modo de movimento reduzido precisa desabilitar o efeito visual.');

const seenLinks = new Set();
let optimizedBytes = 0;
const snapshots = [];
for (const [i, card] of cards.entries()) {
  const link = card.match(/<a\b[^>]*class="service-index-card__link"[^>]*href="([^"]+)"[^>]*>/)?.[1];
  const image = card.match(/<img\b[^>]*class="service-index-card__image"[^>]*>/)?.[0] ?? '';
  const src = image.match(/\ssrc="([^"]+)"/)?.[1];
  const text = card.match(/data-service-searchable="([^"]+)"/)?.[1] ?? '';
  check(Boolean(link) && link.startsWith('/'), `Card ${i+1}: o cartão inteiro deve ser um link.`);
  check(!seenLinks.has(link), `Card ${i+1}: link duplicado.`);
  seenLinks.add(link);
  check(/<h3\b/.test(card), `Card ${i+1}: H3 semântico ausente.`);
  check(/<p\b/.test(card), `Card ${i+1}: descrição ausente.`);
  check(/aria-label="Conhecer o serviço: /.test(card), `Card ${i+1}: link sem nome acessível.`);
  check(/alt=""/.test(image) && /decoding="async"/.test(image), `Card ${i+1}: imagem decorativa não otimizada para acessibilidade.`);
  check(Boolean(src) && /\.(webp|jpg)$/.test(src), `Card ${i+1}: imagem precisa ser WebP ou JPEG pré-otimizado, não PNG.`);
  if (src) {
    try { optimizedBytes += (await stat(path.join('dist', src.replace(/^\//, '')))).size; }
    catch { failures.push(`Card ${i+1}: imagem ausente no build: ${src}`); }
  }
  snapshots.push({ dataset: { serviceSearchable: text }, hidden: false, groupIndex: i < 6 ? 0 : i < 8 ? 1 : 2 });
}
const groups = [0, 1, 2].map((groupIndex) => ({
  hidden: false,
  querySelector: () => snapshots.some((card) => card.groupIndex === groupIndex && !card.hidden) ? {} : null,
}));
check(optimizedBytes > 0 && optimizedBytes < 400 * 1024, `Imagens do catálogo acima do orçamento de 400 KiB: ${Math.round(optimizedBytes/1024)} KiB.`);

// Executa o JS real do catálogo sobre um DOM mínimo. Não depende de navegador.
const callbacks = {};
const search = { value: '', addEventListener: (event, callback) => { callbacks[event] = callback; } };
const empty = { hidden: true };
const results = { textContent: '' };
const document = {
  querySelector: (selector) => ({
    '[data-service-search]': search,
    '[data-service-empty]': empty,
    '[data-service-results]': results,
  }[selector] ?? null),
  querySelectorAll: (selector) => selector === '[data-service-card]' ? snapshots : selector === '[data-service-group]' ? groups : [],
};
vm.runInNewContext(js, { document });
const run = (query) => {
  search.value = query;
  callbacks.input();
  return snapshots.filter(card => !card.hidden).length;
};
check(run('pcmso') === 1, 'Pesquisa por PCMSO deve mostrar exatamente 1 serviço.');
check(run('GESTÃO') > 0, 'Pesquisa com acento e letras maiúsculas deve funcionar.');
check(run('e-social') === 1 && run('esocial') === 1, 'E-Social e esocial devem encontrar o mesmo serviço.');
check(run('incêndio') >= 1 && run('incendio') >= 1, 'Pesquisa com e sem acento deve funcionar.');
check(run('periculosidade') === 1, 'Pesquisa de perícias não encontra o termo.');
check(run('pgr') === 1, 'Pesquisa de PGR não encontra o serviço dedicado.');
check(run('mobilização') === 1, 'Pesquisa de mobilização não encontra o acompanhamento técnico.');
check(run('resíduos') === 1, 'Pesquisa ambiental não encontra o serviço correspondente.');
check(run('qualidade') === 1 && groups[0].hidden && groups[1].hidden && !groups[2].hidden, 'Pesquisa deve esconder grupos sem resultados.');
check(run('texto inexistente') === 0 && empty.hidden === false, 'Estado vazio do catálogo não aparece.');
check(run('') === 13 && empty.hidden === true && groups.every((group) => !group.hidden), 'Limpar a busca deve recuperar os 13 serviços e os três grupos.');
check(results.textContent === '13 serviços encontrados', 'Contagem de serviços visíveis incorreta.');

if (failures.length) {
  for (const f of failures) console.error('[catalogo][FAIL]', f);
  process.exitCode = 1;
} else {
  console.log(`[catalogo] PASS: 13 cartões clicáveis em três grupos, imagens existentes (${Math.round(optimizedBytes/1024)} KiB no total), pesquisa e mobile.`);
}
