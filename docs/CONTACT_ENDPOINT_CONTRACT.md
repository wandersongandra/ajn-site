# Contrato do endpoint de contato

Status em 20/10/2026: **não configurado em produção**.

O Astro só renderiza o formulário quando `PUBLIC_CONTACT_ENDPOINT` contém uma
URL HTTPS sem usuário ou senha. Sem essa variável, `/contato` mantém os canais
de WhatsApp e e-mail ativos e não promete um envio que não possa ser confirmado.
Quando o endpoint está configurado, o formulário não expõe `action` para POST
nativo: o botão começa desabilitado e o JavaScript o habilita apenas para o
fluxo que cria `submission_id` e envia `FormData` explicitamente.

## Requisitos mínimos do receptor

- aceitar `POST` HTTPS com `multipart/form-data`;
- permitir a origem exata `https://ajnengenharia.com.br` no CORS, sem
  `Access-Control-Allow-Origin: *`;
- quando o endpoint for externo, adicionar sua origem exata a `connect-src` na
  CSP publicada; a política atual não libera destinos arbitrários. Não usar
  `connect-src https:` como atalho;
- responder com `2xx` somente depois de aceitar e encaminhar a mensagem;
- responder `4xx` para validação, `429` para limite e `5xx` para falha de
  processamento; nenhuma dessas respostas pode ser tratada como sucesso;
- validar no servidor tipo, tamanho e conteúdo dos campos, ignorando qualquer
  validação feita apenas pelo navegador;
- rejeitar o honeypot `website` preenchido, aplicar proteção contra abuso e
  limitar o tamanho total da requisição;
- tratar o anexo como não confiável: permitir apenas PDF, DOC, DOCX, JPG e PNG,
  verificar MIME por conteúdo, impor limite de 5 MB, remover nomes perigosos e
  evitar execução ou exposição pública direta;
- não registrar no GA4, logs de acesso ou respostas de erro o nome, telefone,
  e-mail, mensagem, anexo ou URL completa do link de contato;
- definir retenção, destinatário e base legal para os dados antes de ativar o
  endpoint em ambiente público.
- o navegador deve abortar uma tentativa que não conclua em tempo razoável e
  devolver o formulário para nova tentativa; isso não substitui timeout e
  limites no receptor.
- o campo `submission_id` é um identificador opaco por tentativa lógica. O
  navegador o reutiliza ao repetir o mesmo conteúdo após timeout ou falha de
  resposta; o receptor deve deduplicar esse valor de forma atômica e não
  encaminhar duas vezes a mesma submissão.

## Campos enviados

| Campo | Obrigatório | Limite/observação |
| --- | --- | --- |
| `nome` | sim | texto; o servidor deve limitar tamanho e normalizar espaços |
| `email` | sim | e-mail válido; máximo recomendado de 254 caracteres |
| `telefone` | sim | texto; não confiar em formato ou DDI informado pelo cliente |
| `como_nos_conheceu` | sim | valor deve pertencer à lista aprovada pelo receptor |
| `mensagem` | sim | máximo de 4.000 caracteres no cliente e no servidor |
| `anexo` | não | um arquivo; máximo de 5 MB; inspeção server-side obrigatória |
| `website` | não | honeypot; qualquer valor deve ser rejeitado ou descartado sem envio |
| `submission_id` | sim | identificador opaco para deduplicação; não contém dados pessoais |

## Critério de ativação

Antes de configurar `PUBLIC_CONTACT_ENDPOINT` na Hostinger, executar um teste
controlado no receptor real: validação de campos, anexo permitido e rejeitado,
honeypot, limite de abuso, CORS, respostas `2xx/4xx/429/5xx`, destino da
mensagem, retenção e remoção. Não usar uma caixa de e-mail ou webhook inventado
como endpoint de produção.
