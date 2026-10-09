# Feed editorial do Instagram — AJN

## Situação

A Home exibe uma seleção de seis publicações públicas verificadas do perfil oficial @ajnengenharia. Os cartões funcionam sem imagens e levam diretamente aos Reels ou posts originais. Eles **não carregam scripts, iframes ou cookies do Instagram automaticamente**.

As capas originais devem ser fornecidas pela própria AJN em arquivos locais WebP. Não copie URLs temporárias de CDN do Instagram: essas URLs expiram e podem quebrar a apresentação.

Uma tentativa controlada de obter as imagens automaticamente em GitHub Actions foi bloqueada pela resposta pública do Instagram: o HTML retornado ao servidor não permitiu verificar a autoria. Nenhuma imagem duvidosa foi publicada; o importador temporário foi retirado da branch.

## Adicionar capas reais

Exporte a capa original do post a partir dos arquivos de mídia da AJN ou do fluxo oficial da conta, com permissão para uso institucional. Para imagens com colaboradores/clientes, valide as autorizações aplicáveis.

Salve os arquivos nas seguintes rotas, sem trocar os identificadores:

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

O componente `src/components/InstagramHighlights.astro` identifica quais arquivos existem **durante o build estático**. Quando o arquivo da capa passa a existir e um novo build é executado, a imagem aparece automaticamente. Se a capa não existir, o cartão permanece como texto e link funcional. Não há dependência de API do Instagram.

## Publicações ainda pendentes

Os links a seguir não retornaram informações verificáveis no momento da revisão e não foram incluídos:

- https://www.instagram.com/reel/DUoAkNbETgc/
- https://www.instagram.com/reel/DTsDNOZDvoy/

Verifique manualmente a disponibilidade no perfil da AJN antes de adicionar ao catálogo.

## Medição de resultado

A seção pode gerar tráfego **do site para o Instagram**, mas um clique não equivale necessariamente a uma reprodução do Reel. O melhor é medir: cliques de saída consentidos no GA4, alcance/reproduções no Instagram Insights e origem do público quando disponível.

A medição deve respeitar o gerenciamento atual de consentimento. Não adicionar Pixel do Meta ou outros rastreadores sem revisão técnica/jurídica.

## Verificação antes de publicar

1. Conferir os arquivos e seus direitos de uso.
2. Executar `npm run check`, `npm run build` e `npm run audit:social`.
3. Inspecionar desktop e mobile (320 px, 390 px e 1440 px), inclusive foco pelo teclado e rolagem horizontal.
4. Conferir que todos os links levam à publicação certa, inclusive sem aceitar cookies.
5. Somente após revisão técnica, considerar o merge na `main`.
