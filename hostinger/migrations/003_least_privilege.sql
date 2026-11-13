-- Menor privilegio no painel de carreiras.
-- Aplicar depois de 002_hardening.sql.

-- O log de auditoria registra IP e user agent de candidatos e as acoes dos
-- demais operadores. E controle de seguranca e dado pessoal, nao insumo de
-- recrutamento. Fica restrito a super_admin (que ignora a tabela de permissoes)
-- e ao papel dpo, que responde pelas solicitacoes de titular.
DELETE FROM admin_permissions WHERE role='recruiter' AND permission='audit:read';
