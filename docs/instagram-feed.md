# Feed Instagram — fotografias reais do acervo AJN

A vitrine da Home relaciona seis publicações reais da conta oficial `@ajnengenharia`. Os links apontam aos vídeos ou posts originais.

As seis capas do site foram substituídas por fotografias reais cedidas à AJN e tratadas para web. **Essas fotografias apenas contextualizam os temas e podem não corresponder à imagem publicada no Instagram**. Isso é comunicado no rodapé da seção. Não apresentam as situações como fatos comprovados em cada publicação.

## Arquivos locais

- `public/images/social/DUagMmhkTBG.webp`: insalubridade / contexto profissional
- `public/images/social/DSKuL-yEXrF.webp`: operação com equipamento / engenharia
- `public/images/social/DTxR39Yjky3.webp`: campo e prevenção de riscos
- `public/images/social/DUJRrqxkbkI.webp`: treinamento / equipe
- `public/images/social/DSmc5DGjiQW.webp`: inspeção e segurança em obra
- `public/images/social/DRnThhXEhtu.webp`: instalações técnicas / segurança operacional

As ilustrações SVG antigas não são referenciadas na Home. Podem ser excluídas do repositório em limpeza posterior, após comprovar que nenhum outro módulo as consome.

## Privacidade e medição

O carregamento é local: não incorpora iframe, APIs de captura, cookies ou scripts do Instagram. O `instagram_outbound_click` é encaminhado ao GA4 pelo gestor de privacidade apenas mediante consentimento, sem coletar dados pessoais adicionais.

## Revisão de conteúdo e direitos

Conferir autorizações de uso de imagem de colaboradores e terceiros, sinais identificáveis de clientes e eventuais informações exibidas em documentos. Para conteúdos educativos, a fotografia usada não comprova execução específica, conformidade normativa nem emissão de certificado. Nunca afirmar isso na legenda sem documentação correspondente.

Após qualquer troca, executar build e `npm run audit:social`.
