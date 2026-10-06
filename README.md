# AJN Consultoria e Engenharia — Astro

Reconstrução estática da homepage do site da AJN a partir do WordPress legado,
com conteúdo, identidade visual e assets reais preservados.

A Home foi concluída na Fase 1. A Fase 2 adicionou somente uma rota
representativa por família de template; as demais URLs permanecem documentadas
para as próximas fases.

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
