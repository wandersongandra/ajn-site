// A-014/A-015 — regressão do índice de serviços: links e resumos úteis.
import { readFile } from 'node:fs/promises';
const html = await readFile('dist/servicos/index.html', 'utf8');
const cards = [...html.matchAll(/<article\b[^>]*\bdata-service-card\b[^>]*>([\s\S]*?)<\/article>/gi)].map(match => match[1]);
const failures = [];
if (cards.length !== 10) failures.push(`Dez serviços esperados, ${cards.length} encontrados.`);

for (const card of cards) {
  const heading = card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || 'Título ausente';
  const description = card.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
  if (!/aria-label=["']Ver detalhes de [^"']+["']/.test(card)) {
    failures.push(`${heading}: o link genérico precisa de nome acessível específico.`);
  }
  if (!description || /\.\.\.\s*$/.test(description.trim()) || description.includes('...Saiba mais')) {
    failures.push(`${heading}: resumo vazio ou truncado.`);
  }
}
const exactPath = '/servicos/projetos-eletricos-residenciais-comerciais-e-prediais-com-foco-em-qualidade-prazo-e-economia';
if (!cards.some(card => card.includes(`href="${exactPath}"`))) {
  failures.push('Projetos elétricos não aponta para a página completa do serviço.');
}
if (failures.length) {
  for (const failure of failures) console.error('[services][FAIL]', failure);
  process.exitCode = 1;
} else {
  console.log('[services] PASS: 10 cards, resumos completos e rota correta para projetos elétricos.');
}
