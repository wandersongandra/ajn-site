# Revisão editorial e técnica — privacidade, termos e cookies

**Data:** 2026-10-08. **Origem:** textos aprovados pela AJN e integrados na PR #53. Esta revisão não altera infraestrutura, domínio, mensagens de e-mail ou DNS.

## Inventário técnico verificado

- Site institucional Astro estático, páginas de contato e comunicação externa por WhatsApp e e-mail. O formulário de contato só é exibido quando `PUBLIC_CONTACT_ENDPOINT` representa um destino HTTPS válido, e passou a apresentar link à Política de Privacidade.
- Fontes da página são carregadas diretamente do Google Fonts, com dados de conexão enviados ao provedor. Links para redes sociais e WhatsApp, sem widgets incorporados, levam a sistemas externos quando acionados.
- Na revisão dos scripts próprios (`public/scripts/` e `src/`), não foram identificadas chamadas de `document.cookie`, `localStorage`, `sessionStorage`, Google Analytics, Meta Pixel ou equivalentes. Isto **não comprova** que CDN/Hostinger ou destinos externos nunca gerem cookies em circunstâncias específicas.
- A configuração pública de cookies e headers `Set-Cookie` **não foi exaustivamente auditada em todos os navegadores/sessões**. Para concluir, inspecionar o Network/Application do Chrome/Firefox numa janela limpa, visitas a páginas principais e cenários móveis; conferir domínio, nome, validade, finalidade e terceiros.

## Decisão sobre banner de consentimento

**Não implementar banner falso de aceitação** enquanto não houver cookies opcionais ou rastreadores ativos a bloquear/desbloquear. Um banner sem controle real cria falsa impressão de conformidade. A seção identificável `#cookies` na Política de Privacidade e o link direto no rodapé informam claramente a situação vigente. Se forem adicionados Analytics, Meta Pixel, vídeos incorporados, publicidade, remarketing ou cookies não essenciais, a PR correspondente deverá implantar bloqueio prévio, consentimento granular quando necessário, rejeição em igual destaque e opção de revisão posterior, conforme o guia da ANPD.

## Mudanças editoriais

- Seções navegáveis com IDs e foco acessível, melhor largura de leitura e âncoras adaptadas ao cabeçalho fixo.
- Identificação da AJN (CNPJ e contato conhecido), categoria de dados fornecidos e registros técnicos, finalidades e hipóteses legais descritas sem atribuir uma única base a todo tratamento.
- Direitos de titulares, prazo de guarda dependente da situação real, provedores de hospedagem, Google Fonts, WhatsApp e plataformas externas.
- Termos preservam o propósito institucional e direitos de propriedade intelectual, evitando tratar visita à página como consentimento irrevogável ou contrato de prestação de serviço.
- Novo teste `npm run audit:legal` no gate de preview e produção, com falha se scripts próprios conhecidos passarem a criar cookies/instalar trackers sem revisão. **Não substitui revisão jurídica**.

## Informações a confirmar pela AJN

- Nome empresarial / razão social oficial conforme cadastro CNPJ; CNPJ exibido `50.970.588/0001-84` e endereço devem estar consistentes.
- Política interna de retenção e eliminação, encarregado/canal de solicitações formal e prestadores com eventual transferência internacional de dados.
- Se houver cookies operacionais da Hostinger, inventariar nomes e prazos; verificar também recursos externos inseridos via hPanel ou ferramentas sem versionamento.
- Conferência jurídica do conteúdo aprovado antes do merge, caso haja necessidade de ajuste material nos compromissos internos declarados.

Fontes: Guia Orientativo sobre Cookies e Proteção de Dados Pessoais (ANPD); Direitos dos Titulares (ANPD).
