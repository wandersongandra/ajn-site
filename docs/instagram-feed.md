# Feed editorial do Instagram — AJN

## Situação

A Home exibe uma seleção de seis publicações públicas identificadas do perfil @ajnengenharia. Os cartões têm **capas editoriais ilustrativas, criadas digitalmente** e identificadas visualmente como tal. Essas artes não representam registros fotográficos da execução dos serviços, da equipe ou de clientes. Os links abrem as publicações originais, sem carregar scripts, iframes ou cookies do Instagram automaticamente.

As seis capas ilustrativas estão em `public/images/social/<id>.svg`, são leves e não dependem do Instagram. Se a AJN fornecer capas reais com direito de uso, adicione os respectivos arquivos WebP e o componente passa a utilizá-los automaticamente. Não copie URLs temporárias do CDN do Instagram.

Uma tentativa controlada de recuperar automaticamente as miniaturas reais pelo GitHub Actions não obteve metadados suficientes para validar a autoria e foi encerrada. As imagens utilizadas agora são ilustrações originais, sem alegação de retratar eventos reais.

## Capas artificiais implementadas e substituição opcional

O site já possui seis artes ilustrativas próprias nos arquivos `.svg`. Para substituí-las por fotografias reais, exporte a capa de cada publicação a partir dos arquivos da AJN ou do perfil oficial, com permissão de uso. Valide as autorizações aplicáveis para imagens com colaboradores e clientes.

Arquivos WebP opcionais para substituir automaticamente cada arte ilustrativa correspondente:

| Tema | Caminho local esperado | Publicação original |
|---|---|---|
| Insalubridade | `public/images/social/DUagMmhkTBG.webp` | https://www.instagram.com/reel/DUagMmhkTBG/ |
| Içamento de chillers | `public/images/social/DSKuL-yEXrF.webp` | https://www.instagram.com/reel/DSKuL-yEXrF/ |
| Prevenção de acidentes | `public/images/social/DTxR39Yjky3.webp` | https://www.instagram.com/reel/DTxR39Yjky3/ |
| NR-35 na Hemarcon | `public/images/social/DUJRrqxkbkI.webp` | https://www.instagram.com/p/DUJRrqxkbkI/ |
| Visita técnica | `public/images/social/DSmc5DGjiQW.webp` | https://www.instagram.com/p/DSmc5DGjiQW/ |
| Instalação de climatização | `public/images/social/DRnThhXEhtu.webp` | https://www.instagram.com/p/DRnThhXEhtu/ |

### Arquivos recomendados

- Formato: WebP (imagens reais retiradas de suas respectivas publicações).
- Resolução sugerida: ao menos 600 px de largura, sem ampliar imagens pequenas.
- Peso recomendado: aproximadamente 60–180 KiB por imagem, ajustando a qualidade de forma visual.
- Corte exibido: 4:5 com `object-fit: cover`; mantenha textos e pessoas dentro da área central.
- Não grave imagens médicas, dados pessoais sensíveis, nomes de terceiros sem autorização, documentos ou endereços privados visíveis.

O componente `src/components/InstagramHighlights.astro` verifica os arquivos **durante o build estático**. Usa a fotografia WebP real se disponível; caso contrário, mostra a arte digital SVG com o selo **Imagem ilustrativa** e explicação no rodapé da seção. Não há dependência de API do Instagram.

## Publicações ainda pendentes

Os links a seguir não retornaram informações verificáveis no momento da revisão e não foram incluídos:

- https://www.instagram.com/reel/DUoAkNbETgc/
- https://www.instagram.com/reel/DTsDNOZDvoy/

Verifique manualmente a disponibilidade no perfil da AJN antes de adicionar ao catálogo.

## Medição de resultado

A seção pode gerar tráfego **do site para o Instagram**, mas um clique não equivale necessariamente a uma reprodução do Reel. Os eventos `instagram_outbound_click` só são encaminhados pelo módulo central `privacy-notice.js` ao GA4 quando existe consentimento válido. Compare os cliques com alcance/reproduções no Instagram Insights, quando disponível.

A medição deve respeitar o gerenciamento atual de consentimento. Não adicionar Pixel do Meta ou outros rastreadores sem revisão técnica/jurídica.

## Verificação antes de publicar

1. Conferir se os seis arquivos ilustrativos e os selos de transparência aparecem corretamente.
2. Executar `npm run check`, `npm run build` e `npm run audit:social`.
3. Inspecionar desktop e mobile (320 px, 390 px e 1440 px), inclusive foco pelo teclado, controles de navegação e rolagem horizontal.
4. Conferir que todos os links levam à publicação certa, inclusive sem aceitar cookies.
5. Somente após revisão técnica, considerar o merge na `main`.
