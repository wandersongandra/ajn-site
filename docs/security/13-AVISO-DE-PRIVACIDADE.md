# Consentimento GA4 opcional e configuração futura

O aviso permite Aceitar análise, Rejeitar opcionais ou Personalizar. A categoria necessária permanece ativa e não exige aceite. Nenhuma tag GA4 é inserida antes da escolha afirmativa. O consentimento local dura até 180 dias, inclui a versão e o ID GA4; ao ativar um novo ID, as escolhas antigas não são reaproveitadas. Rejeição não prejudica navegação. O link de preferências no rodapé permite revogação e o script desativa GA4, tenta excluir cookies de análise conhecidos e recarrega a página. A exclusão não remove dados já enviados nem cookies de outros domínios.

## Ativação pela AJN, após criar GA4
1. Criar propriedade GA4 e fluxo de dados web para `https://ajnengenharia.com.br`; copiar o ID no formato `G-XXXXXXXXXX`.
2. No ambiente de **build** da Hostinger, configurar `PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`. O valor é público, não é segredo. Recompilar e publicar o Astro. Não é necessário alterar DNS, e-mail, hPanel de correio ou credenciais.
3. Abrir site em janela anônima, confirmar **nenhuma requisição** a `googletagmanager.com` ou `google-analytics.com` antes do consentimento; confirmar que rejeitar não carrega GA; aceitar deve carregar uma tag e registrar page_view. Reabrir pelo rodapé e revogar, garantindo que não haja novas medições após recarga.
4. Conferir Realtime no GA4 e relatórios de país, região e cidade (estimativas, sujeitos a limiares de privacidade). O GA4 não fornece localização precisa e não mede visitantes que recusam analytics nesta implementação.

## Segurança e conformidade
- CSP inclui apenas `www.googletagmanager.com`, `www.google-analytics.com` e `region1.google-analytics.com` nas diretivas necessárias. CSP continua enforced e Report-Only, sem `unsafe-inline` nem `unsafe-eval`.
- Não configurar publicidade personalizada, Google Signals ou envio de PII. O GA4 está preparado apenas para page_view e relatórios agregados. Evitar enviar dados pessoais em URL e títulos de páginas.
- Política de Privacidade atualizada para análise opcional e cookies típicos `_ga` e `_ga_*`, sem prometer prazo específico dos cookies gerados pelo Google.
- Testes unitários validam bloqueio prévio, aceite, rejeição, personalização e revogação; auditoria de CI detecta novos rastreadores fora do módulo de consentimento.
- Antes de ativar o ID real, realizar QA de navegador e revisar eventuais cookies gerados pelo provedor Hostinger. Uma revisão jurídica final é recomendada.

**Sem ID válido**, o banner pode registrar escolhas, mas **nenhum script GA4 será carregado**. A ativação de um ID novo exige nova escolha.
