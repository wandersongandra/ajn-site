# AJN — Fase 3, piloto SEO orientado a demanda (20/10/2026)

## Fonte e janela
Google Search Console, propriedade `sc-domain:ajnengenharia.com.br`, recuperado pelo conector Windsor.ai, janela **08 a 17/10/2026**. Análise por página, agrupando as variantes do host e da barra final no mesmo **caminho**; valores de cliques/impressões são observados, não são previsão de tráfego ou conversão.

| Caminho agrupado | Impressões | Cliques | CTR calculado |
| --- | ---: | ---: | ---: |
| `/blog/esocial-sst-diferencas-entre-s2210-s2220-e-s2240` | 293 | 1 | 0,34% |
| `/blog/avaliacao-de-iluminamento-posto-de-trabalho-nho-11` | 221 | 0 | 0,00% |
| `/empresa-projeto-eletrico-bh` | 154 | 1 | 0,65% |
| `/projeto-eletrico-residencial-belo-horizonte` | 87 | 1 | 1,15% |

**Limitações:** o Search Console apresenta atraso e agregação por consultas/páginas; resultados podem variar pela janela e dimensões. Não atribuir alterações futuras exclusivamente ao conteúdo sem controlar posição, dispositivo e sazonalidade. A linha de base não mede leads nem contratos.

## Alterações propostas
1. Revisão editorial e comercial das duas páginas de projetos elétricos em BH: respostas claras a **quando contratar**, **entregas possíveis**, **informações necessárias ao orçamento** e **próximos passos**.
2. Exclusão de afirmações promocionais vagas e serviços não relacionados do texto residencial (PMOC, manutenção de elevadores e combate a incêndio).
3. Títulos e descrições legíveis, com intenção de busca explícita, sem repetição artificial de palavras-chave.
4. Links internos úteis para o serviço principal de projetos elétricos e para `/contato/`.
5. Ajuste pontual das descrições dos artigos de eSocial SST e NHO 11 para resumirem o assunto de forma mais objetiva.

## Limites de segurança editorial
- **Nenhuma URL, slug, sitemap, canonical ou redirecionamento é alterado.**
- Nenhuma avaliação técnica, acreditação, equipe, certificação, preço ou prazo é inventado.
- As imagens existentes foram preservadas; validação visual e direitos de uso permanecem parte da auditoria de mídia.
- Os materiais são orientação editorial; normas, escopo contratual e capacidade efetiva de atendimento dependem de validação com a AJN.
- Não alterar GA4, formulário, CSP, hospedagem nem DNS neste lote.

## Aceitação
- `npm ci`, `npm run check`, `npm run build`, `npm run validate`, `npm run audit:seo`, `npm run audit:editorial`, `npm run audit:engineering`, `npm run audit:sst-seo` e browser smoke aprovados na PR.
- Conferir os títulos/H1/metas renderizados das quatro páginas e links internos efetivos.
- Revisão editorial por responsável técnico/comercial antes do merge.
- Reavaliar desempenho orgânico após 4 a 6 semanas, sem prometer melhora de posição ou CTR.
