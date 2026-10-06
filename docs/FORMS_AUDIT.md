# Auditoria de formulários

Data da auditoria: 2026-10-06

## Fonte e limites

Os formulários abaixo foram confirmados no HTML público atual. O backup WordPress local contém referências a componentes WPForms/Elementskit e cache de e-mail, mas não contém uma base atual de submissions nem configuração suficiente para provar o destino operacional. Nenhum valor de lead foi reproduzido.

## Comparação

| Formulário | Página | Campos confirmados | Funcionamento antigo | Funcionamento novo | Status |
|---|---|---|---|---|---|
| Captura WhatsApp | `/` e popup global em `/contato` | `whatsapp` oculto, `nome`, `telefone`, `email` oculto, `como_nos_conheceu` oculto, `mensagem` oculta, reCAPTCHA | `POST`, `multipart/form-data`, processamento na própria página, botão de envio para WhatsApp | Não existe formulário equivalente; o popup novo apenas leva para `/contato` | **FAIL — funcionalidade importante desapareceu** |
| Contato principal | `/contato` | `nome`, `email`, `telefone`, `como_nos_conheceu`, `anexo`, `mensagem`, reCAPTCHA | `POST`, `multipart/form-data`, aceita anexo e usa proteção reCAPTCHA; destino efetivo do servidor não foi confirmado | `/api/contact` aceita nome, e-mail, empresa, telefone, serviço e mensagem; valida Zod, honeypot e rate limit; não aceita anexo nem `como_nos_conheceu`; delivery retorna 503 enquanto desabilitado | **WARN/FAIL — contrato de campos incompatível e envio inoperante** |
| Formulário legado WordPress | snapshot local | Não determinável com segurança; há cache WPForms e widgets de integração, mas não há dump atual correspondente | Não há evidência suficiente para afirmar submissions, destinatário ou webhook | Não migrado; exige revisão operacional antes de qualquer importação | **BLOCKED** |

## Estado do novo app

- Frontend: `src/components/site/ContactForm.tsx`.
- Endpoint: `src/app/api/contact/route.ts`.
- Schema: `src/lib/contact.ts`.
- Delivery: desabilitado por `.env.example`; não há credencial real.
- Não há banco, `/admin/leads` ou persistência local.

## Estado do `astro-site` — Fase 2

- A Home e o popup continuam sem formulário próprio; o CTA preserva o destino
  de contato, mas não substitui o contrato legado de captura WhatsApp.
- `/contato` foi implementada como página estática representativa, sem envio,
  SMTP, API, banco ou adapter.
- A implementação dos campos, anexos, reCAPTCHA/Turnstile e destino exige
  `NEEDS_USER_DECISION` porque o artefato local não comprova o processamento
  operacional atual.
- Nenhuma submission, lead ou dado pessoal foi copiado para o Astro.

## Riscos

1. O usuário pode perder a opção de enviar anexo.
2. A origem de lead `como_nos_conheceu` não é preservada.
3. O fluxo WhatsApp do popup foi substituído por um CTA genérico.
4. O formulário novo aparenta aceitar envio, mas retorna `503` até o adapter ser configurado.
5. O rate limit é local à instância e não deve ser tratado como proteção de produção.

## Próximo desenho recomendado

Manter um único contrato explícito, preservando os campos públicos confirmados: nome, e-mail, telefone, origem, mensagem e anexo opcional. O adapter deve suportar e-mail/API externa, validação server-side, reCAPTCHA/Turnstile, limite distribuído e resposta de sucesso somente após confirmação do provider. Nenhum banco deve ser introduzido sem requisito de retenção de leads.
