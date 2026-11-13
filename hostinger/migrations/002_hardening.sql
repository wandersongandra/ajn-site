-- Endurecimento de sessao e MFA do painel de carreiras.
-- Aplicar apos 001_initial.sql e antes de publicar a versao correspondente do bootstrap.php.
-- As duas colunas sao obrigatorias: o backend recusa autenticacao sem elas.

-- Contador TOTP ja consumido. Impede reaproveitar o mesmo codigo dentro da janela de 90s.
ALTER TABLE admin_users
  ADD COLUMN mfa_last_counter BIGINT UNSIGNED NULL DEFAULT NULL AFTER mfa_secret;

-- Teto absoluto da sessao. expires_at passa a ser o limite de inatividade e desliza a cada requisicao.
ALTER TABLE admin_sessions
  ADD COLUMN absolute_expires_at BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER expires_at;

-- Sessoes emitidas antes desta migration nao possuem teto absoluto. Forcar novo login.
DELETE FROM admin_sessions;
