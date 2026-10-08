# AJN — Rodada de design e desempenho de Serviços

Data de execução: 08/10/2026. Projeto `wandersongandra/ajn-site`, Astro estático, publicado pela Hostinger após merge da main.

## Diagnóstico: pontos verificados no código

| Questão | Causa | Correção |
| --- | --- | --- |
| Catálogo de 10 serviços carrega 9 PNGs grandes | As imagens do catálogo referenciavam `/images/services/*.png` com 2.238.000 bytes nos 9 serviços comparáveis | Reutilizar WebP/JPEG já existentes em `/images/content/services`: 186.531 bytes nos mesmos 9 (redução de ~91,7%); recurso elétrico usa WebP existente de 28.278 bytes, total de 10 imagens 214.809 bytes |
| Clique no cartão restrito a um link textual | Estrutura anterior tinha imagem/título fora da âncora | Um link semântico cobre cada cartão; H2 preservado, foco de teclado com contorno visível |
| Filtro dependia do título exato | JS buscava só `data-service-title`; acentos e termos na descrição não eram considerados | Pesquisa por título e descrição, normalização de acentos, comparação de múltiplas palavras e variantes de eSocial |
| Informações de serviço pouco legíveis | Cartões com tipografia pequena e descrições truncadas | CSS isolado com tamanhos mínimos, gradiente para leitura, layout 3/2/1 colunas, mobile com foco e movimento reduzido |
| Programas PGR e LTCAT difíceis de localizar a partir do catálogo | Duas páginas comerciais existentes ficavam fora da grade principal | Links editoriais discretos no início do catálogo, sem gerar páginas duplicadas |
| Declaração global de fontes inconsistente | `:root` inicial declarava Manrope, mas regras seguintes e Google Fonts usam Open Sans | Alinhar declaração inicial a Open Sans; **não altera a fonte final renderizada**, evita confusão no desenvolvimento |

## Critérios automatizados

`npm run audit:services-catalog` executa após o build e verifica:

- 10 cartões, destinos não repetidos, hierarquia semântica H2, foco e conteúdo de serviço.
- Recursos otimizados efetivamente copiados para `dist`; orçamento de até 400 KiB para os 10 arquivos principais.
- Normalização da pesquisa (PCMSO, eSocial com/sem hífen, palavras acentuadas, estado sem resultados, reset), usando o JS real em DOM simulado.
- Estados acessíveis, grid mobile, contraste contextual e `prefers-reduced-motion` no CSS.

O audit também integra o Quality Gate da CI.

## Verificação externa e limites

- A inspeção visual automatizada em navegador na plataforma TinyFish foi solicitada, **mas não começou por falta de saldo na carteira**. Portanto, não há resultados de screenshots desktop/mobile nesta rodada.
- A comparação acima mede tamanho de **arquivos no repositório**, não Web Vitals, LCP, tráfego efetivo nem dados de usuários.
- O GSC Wizard ainda não estava configurado com chave CrUX; não publicar métricas de LCP ou CLS sem coleta real.
- Conferir após deploy: /servicos/ no desktop e em 360px/390px/768px; card inteiro clicável; filtro; fontes e ausência de recortes; as imagens selecionadas correspondem aos serviços.

## Próximas etapas

1. Validar visualmente em navegador ou screenshots autorizadas as três páginas centrais (Home, Serviços, Blog) após publicação.
2. Avaliar Core Web Vitals e waterfall de recursos com Lighthouse (LCP, CLS, INP); só então priorizar novas otimizações.
3. Refatorar progressivamente estilos legados do arquivo `global.css` (atualmente com blocos duplicados), respeitando testes de regressão e comparações visuais.
4. Reavaliar qualidade e legibilidade das logos da faixa de clientes **sem mudar as marcas** e preservando carrossel desktop sem cartões.
5. Revisar a abertura do menu mobile, alvo de toque e navegação por teclado com testes reais.

## Regras de publicação

Exigir Quality Gate + CodeQL + verificações de dependências e segredos PASS na branch; merge e checagem do HTML público. Não alterar DNS, e-mails, WordPress ou configuração de domínio.
