import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const homepage = await readFile('dist/index.html', 'utf8');
const component = await readFile('src/components/InstagramHighlights.astro', 'utf8');
const errors = [];
const check = (ok, message) => { if (!ok) errors.push(message); };

const section = homepage.match(/<section\b[^>]*class="section instagram-highlights"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? '';
check(Boolean(section), 'A Home não contém a vitrine de Instagram.');
check((section.match(/class="instagram-highlights__card"/g) ?? []).length === 6, 'Esperados seis cartões editoriais com links originais.');
check(section.includes('aria-label="Publicações selecionadas do Instagram da AJN"'), 'A seção não possui nome acessível.');
check(section.includes('tabindex="0"'), 'Área horizontal não oferece navegação pelo teclado.');
check(!/<iframe\b|<script\b/i.test(section), 'Embeds e scripts de Instagram não devem carregar na Home.');
check(component.includes('localCover: post.cover'), 'As capas reais devem ser usadas diretamente dos arquivos locais.');
check(section.includes('fotografias são do acervo AJN') && section.includes('não são necessariamente as capas originais'), 'Falta aviso editorial sobre o uso de fotos do acervo em posts distintos.');
check(!section.includes('Imagem ilustrativa'), 'Não publicar selo de imagem artificial nas fotos reais.');
check(component.includes('prefers-reduced-motion: reduce'), 'Falta suporte a movimento reduzido.');

const known = [
  ['DUagMmhkTBG', 'reel'],
  ['DSKuL-yEXrF', 'reel'],
  ['DTxR39Yjky3', 'reel'],
  ['DUJRrqxkbkI', 'p'],
  ['DSmc5DGjiQW', 'p'],
  ['DRnThhXEhtu', 'p'],
];
for (const [id, kind] of known) {
  const url = `https://www.instagram.com/${kind}/${id}/`;
  check(component.includes(`href: '${url}'`), `Publicação oficial ausente do componente: ${id}`);
  check(component.includes(`cover: '/images/social/${id}.webp'`), `Capa esperada não mapeada: ${id}`);
  check(section.includes(`src="/images/social/${id}.webp"`), `Foto real da publicação não renderizada: ${id}`);
  check(section.includes(`href="${url}"`), `O link público para ${id} não foi renderizado.`);
}

for (const [, src] of section.matchAll(/src="(\/images\/social\/[^"]+\.(?:webp|svg))"/g)) {
  const local = path.join('dist', src.slice(1));
  try {
    const data = await stat(local);
    check(data.isFile() && data.size > 1000, `Capa sem arquivo válido: ${src}`);
  } catch {
    check(false, `Imagem inexistente apontada no HTML: ${src}`);
  }
}

if (errors.length) {
  errors.forEach(message => console.error('[social][FAIL]', message));
  process.exitCode = 1;
} else {
  console.log('[social] PASS: 6 fotografias locais verificadas, aviso editorial, links e sem embeds externos.');
}
