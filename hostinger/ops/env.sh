#!/usr/bin/env bash
# Caminhos operacionais padrao para Staging e Producao (SEM SEGREDOS).
# Instale em $HOME/ajn-ops/env.sh com chmod 600 e ajuste caso o layout do hPanel difira.

if [ "${AJN_ALLOW_UNSET_DEFAULTS:-0}" != "1" ]; then
  for __ajn_chk in PROD_PUBLIC STG_PUBLIC PROD_PRIVATE STG_PRIVATE STG_HTPASSWD PHP_BIN; do
    if [ "${!__ajn_chk+set}" = "set" ] && [ -z "${!__ajn_chk}" ]; then
      echo "ERRO: variavel obrigatoria definida como vazia antes de carregar env.sh: ${__ajn_chk}" >&2
      unset __ajn_chk
      return 1 2>/dev/null || exit 1
    fi
  done
  unset __ajn_chk
fi

PROD_PUBLIC="${PROD_PUBLIC:-$HOME/domains/ajnengenharia.com.br/public_html}"
STG_PUBLIC="${STG_PUBLIC:-$HOME/domains/staging.ajnengenharia.com.br/public_html}"
PROD_PRIVATE="${PROD_PRIVATE:-$HOME/ajn-private/prod}"
STG_PRIVATE="${STG_PRIVATE:-$HOME/ajn-private/staging}"
STG_HTPASSWD="${STG_HTPASSWD:-$HOME/domains/staging.ajnengenharia.com.br/.htpasswd-staging}"
PHP_BIN="${PHP_BIN:-$(command -v php || true)}"

export PROD_PUBLIC STG_PUBLIC PROD_PRIVATE STG_PRIVATE STG_HTPASSWD PHP_BIN

for __ajn_var in PROD_PUBLIC STG_PUBLIC PROD_PRIVATE STG_PRIVATE STG_HTPASSWD PHP_BIN; do
  if [ -z "${!__ajn_var:-}" ]; then
    echo "ERRO: variavel obrigatoria vazia em env.sh: ${__ajn_var}" >&2
    unset __ajn_var
    return 1 2>/dev/null || exit 1
  fi
done
unset __ajn_var
