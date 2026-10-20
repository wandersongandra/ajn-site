# AJN — Lote 1: domínio canônico e eventos de contato (20/10/2026)

## Escopo
- Padroniza o redirecionamento `www.ajnengenharia.com.br` para `https://ajnengenharia.com.br` com resposta permanente **301**, preservando caminho e query string. Não modifica nenhuma rota nem DNS.
- Mantém a origem de sitemap e canonical já existente, sem migrações de slug.
- Registra evento `contact_channel_click` no GA4 para cliques em links de WhatsApp, telefone e e-mail. Parâmetros: `channel` e `page_path`, sem incluir destino, número, endereço eletrônico ou mensagem.
- Preserva o fluxo de consentimento: **sem aceite, não carrega GA4 nem mede cliques**. O evento não impede a navegação.
- Atualiza aviso e políticas de privacidade/cookies para descrever a nova finalidade.
- Expande testes de regressão para redirecionamento permanente e consentimento/eventos.

## Pré-condições de aprovação
1. GitHub Actions: `Quality Gate`, `Browser smoke`, CodeQL, Gitleaks e Dependency Review aprovados. A mudança na regra do Apache deve passar por `test:hosting-redirect`.
2. Validar no ambiente compatível com Apache/LiteSpeed as respostas HTTP **sem seguir redirecionamentos**:
   - `https://www.ajnengenharia.com.br/` → 301 para `https://ajnengenharia.com.br/`
   - `http://www.ajnengenharia.com.br/servicos?utm_source=teste` → HTTPS apex mantendo path/query (aceitável cadeia prévia de HTTP→HTTPS administrada pela hospedagem).
   - `https://ajnengenharia.com.br/` → 200, sem loop.
   - `https://ajnengenharia.com.br/sitemap-index.xml`, `robots.txt` e canonical das páginas prioritárias coerentes e indexáveis.
   - `/informacoes` continua com o 301 aprovado para `/mapa-site`.
3. Validar `contact_channel_click` no DebugView do GA4 após aceitar análise. Testar links de WhatsApp (botão flutuante e contato), e-mail e telefone onde aplicáveis; conferir que nenhum valor de PII foi enviado.
4. Repetir com rejeição/revogação de análise e verificar ausência de requisições de GA4 e de eventos.
5. Marcar `contact_channel_click` como evento principal no GA4 apenas se a AJN quiser contabilizar cliques de intenção de contato. Cliques não comprovam fechamento de contratos nem envio de formulário.

## Fora do escopo
- Formulário de contato: endpoint HTTPS ainda deve ser contratado/homologado. Não ativar formulário sem serviço seguro e funcional.
- Reformulação editorial, alterações de imagens, DNS, webmail, painel Hostinger, redução de URLs e deploy.
- A regra do host pode depender de configuração externa na Hostinger: confirmar a ordem efetiva dos redirects antes do merge.

## Reversão
- Nenhuma configuração de infraestrutura é alterada nesta PR.
- Em caso de falha em homologação, manter PR sem merge e ajustar a regra a partir dos resultados HTTP.
