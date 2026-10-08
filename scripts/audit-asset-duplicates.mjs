// Inventário não destrutivo de imagens com conteúdo idêntico.
// Não apagar arquivos apenas pelo mesmo hash: cada caminho pode ter URLs e imports ativos.
import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const folders = ['public/images', 'src/assets'];
const extensions = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const sourceExtensions = /\.(astro|css|js|mjs|ts|tsx)$/i;

async function visit(root, accept) {
  const entries = await readdir(root, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const filepath = path.posix.join(root, entry.name);
    if (entry.isDirectory()) results.push(...await visit(filepath, accept));
    else if (entry.isFile() && accept.test(entry.name)) results.push(filepath);
  }
  return results;
}

const images = (await Promise.all(folders.map(folder => visit(folder, extensions)))).flat();
const sources = (await Promise.all(['src', 'public/scripts', 'scripts']
  .map(folder => visit(folder, sourceExtensions)))).flat();
const sourceText = await Promise.all(sources.map(async file => ({
  file,
  text: await readFile(file, 'utf8'),
})));
const groups = new Map();

for (const file of images) {
  const bytes = await readFile(file);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const aliases = groups.get(hash) ?? [];
  aliases.push({ file, bytes: (await stat(file)).size });
  groups.set(hash, aliases);
}
const duplicateGroups = [...groups.values()]
  .filter(group => group.length > 1)
  .sort((a, b) => b[0].bytes * (b.length - 1) - a[0].bytes * (a.length - 1));
const extraBytes = duplicateGroups.reduce((n, group) => n + group[0].bytes * (group.length - 1), 0);

const referencedBy = filename => {
  // public paths render from URL root, while src/assets are imported modules.
  const candidate = filename.startsWith('public/')
    ? filename.slice('public'.length)
    : filename.slice('src/'.length);
  const shortImport = filename.startsWith('src/assets/')
    ? filename.slice('src/assets/'.length)
    : null;
  return sourceText.filter(source =>
    source.text.includes(candidate) || (shortImport && source.text.includes(shortImport))
  ).map(source => source.file);
};

console.log('[asset-inventory] ' + images.length + ' imagens, ' +
  duplicateGroups.length + ' famílias duplicadas, ' +
  Math.round(extraBytes / 1024) + ' KiB em caminhos adicionais.');
for (const group of duplicateGroups.slice(0, 10)) {
  console.log('[asset-inventory] ' + group.length + ' cópias de ' +
    Math.round(group[0].bytes / 1024) + ' KiB:');
  for (const item of group) {
    const references = referencedBy(item.file);
    console.log('  ' + item.file + ' — ' +
      (references.length ? references.length + ' referências textuais' : 'referência textual não encontrada'));
  }
}
console.log('[asset-inventory] Apenas diagnóstico. Nenhum arquivo alterado ou removido.');
