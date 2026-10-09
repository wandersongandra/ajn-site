# Dependências e supply chain

**Data:** 2026-10-08 · **Gerenciador:** npm, confirmado por `package-lock.json` v3.

## Estado

Manifest direto: `astro@^7.3.6`, `@astrojs/sitemap@^3.7.4`, `zod@^4.6.5`; desenvolvimento: `@astrojs/check@^0.9.10`, `typescript@^6.0.3`. Resolução observada no lockfile/runtime local: Astro 7.3.6, sitemap 3.7.4, Zod 4.6.5, check 0.9.10 e TypeScript 6.0.3. O runtime local é Node 24.13.0; o projeto requer `>=22.12.0`; CI usa Node 22.

## Auditoria

- `npm audit --audit-level=high`: **0 vulnerabilidades** no lockfile, incluindo dependências de desenvolvimento, na data desta análise.
- `npm audit --omit=dev --audit-level=high`: comando de release existente; deve continuar rodando por separar a árvore de produção.
- `npm ci` está configurado na CI para instalar a partir do lockfile.
- `npm ls --depth=0` listou dois pacotes extraneous no `node_modules` local (`@img/sharp-wasm32` e `@napi-rs/wasm-runtime`); isso pode refletir estado local e não foi usado como prova de dependência comprometida. Não foi feita limpeza/reinstalação do diretório.
- `package.json` declara permissão de scripts de instalação para `esbuild`; nenhuma dependência nova foi adicionada nesta auditoria.
- Licenças, abandono de pacote e proveniência criptográfica de todos os tarballs não foram auditados individualmente.

## Risco residual e acompanhamento

Zero alertas conhecidos não prova ausência de falhas futuras. Dependabot está configurado semanalmente para npm e GitHub Actions, com limite de cinco PRs. Revisar alterações de lockfile e executar checks antes de integrar; evitar updates em massa não relacionados.
