# AJN Consultoria e Engenharia — Astro

Reconstrução estática do site institucional da AJN a partir do WordPress legado,
preservando as URLs catalogadas, o conteúdo migrado e a identidade visual.

A migração documentada em `docs/MIGRATION_FINAL_STATUS.md` compreende 144
rotas públicas de conteúdo e a rota técnica `/404`. A revisão de SEO, conteúdo
e usabilidade permanece contínua; não confundir rotas geradas com homologação
visual ou operacional de produção.

## Stack e limites

- Astro com TypeScript strict;
- HTML estático (`output: 'static'`);
- CSS próprio e JavaScript mínimo para menu mobile e popup;
- sem banco, API, SSR, ISR, CMS, painel ou runtime Node obrigatório em produção;
- conteúdo estruturado em `src/data/`;
- componentes Astro em `src/components/`;
- imagens selecionadas em `public/images/`.

O WordPress legado e o banco original permanecem fora deste projeto e não são
alterados. A implementação Next.js anterior foi arquivada em
`../new-site-next-archive/` como referência.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação

```bash
npm run check
npm run build
npm run preview
npm run validate
```

O build gera a saída estática em `dist/`. As matrizes de arquitetura e paridade
estão em [`docs/TEMPLATE_MATRIX.md`](docs/TEMPLATE_MATRIX.md),
[`docs/REPRESENTATIVE_PAGES.md`](docs/REPRESENTATIVE_PAGES.md) e
[`docs/TEMPLATE_PARITY.md`](docs/TEMPLATE_PARITY.md).

## Segurança e publicação

Não existem credenciais reais neste projeto. Use `.env.example` caso uma futura
integração exija configuração. Banco legado, dumps, backups, logs e arquivos
privados estão protegidos pelo `.gitignore`.

Nenhum commit, push ou deploy foi realizado durante esta fase.
