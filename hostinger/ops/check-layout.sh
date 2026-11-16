#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=""
PROD_PUBLIC="${PROD_PUBLIC:-}"
STAGING_PUBLIC="${STAGING_PUBLIC:-${STG_PUBLIC:-}}"
PRIVATE_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --env-file=*)
      ENV_FILE="${arg#*=}"
      [ -n "$ENV_FILE" ] || { echo "ERRO: --env-file nao pode ser vazio." >&2; exit 1; }
      ;;
    --prod-public=*)
      PROD_PUBLIC="${arg#*=}"
      [ -n "$PROD_PUBLIC" ] || { echo "ERRO: --prod-public nao pode ser vazio." >&2; exit 1; }
      ;;
    --staging-public=*)
      STAGING_PUBLIC="${arg#*=}"
      [ -n "$STAGING_PUBLIC" ] || { echo "ERRO: --staging-public nao pode ser vazio." >&2; exit 1; }
      ;;
    --private-dir=*)
      [ -n "${arg#*=}" ] || { echo "ERRO: --private-dir nao pode ser vazio." >&2; exit 1; }
      PRIVATE_ARGS+=("${arg#*=}")
      ;;
    --help|-h)
      echo "Uso: $0 [--env-file=PATH] [--prod-public=DIR] [--staging-public=DIR] [--private-dir=DIR ...]"
      exit 0
      ;;
    *)
      echo "Argumento nao reconhecido: $arg" >&2
      exit 1
      ;;
  esac
done

if [ -n "$ENV_FILE" ]; then
  if [ ! -f "$ENV_FILE" ]; then
    echo "ERRO: arquivo --env-file nao encontrado: $ENV_FILE" >&2
    exit 1
  fi
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  [ -z "$PROD_PUBLIC" ] && PROD_PUBLIC="${PROD_PUBLIC:-}"
  [ -z "$STAGING_PUBLIC" ] && STAGING_PUBLIC="${STG_PUBLIC:-}"
fi

for env_var in PROD_PRIVATE STG_PRIVATE; do
  if [ "${!env_var+set}" = "set" ] && [ -z "${!env_var}" ]; then
    echo "ERRO: variavel obrigatoria de ambiente vazia: $env_var" >&2
    exit 1
  fi
done

if [ "${#PRIVATE_ARGS[@]}" -eq 0 ]; then
  [ -n "${PROD_PRIVATE:-}" ] && PRIVATE_ARGS+=("$PROD_PRIVATE")
  [ -n "${STG_PRIVATE:-}" ] && PRIVATE_ARGS+=("$STG_PRIVATE")
fi

if [ -z "$PROD_PUBLIC" ] || [ -z "$STAGING_PUBLIC" ]; then
  echo "Informe --prod-public=... e --staging-public=... (ou carregue env.sh)." >&2
  exit 1
fi

resolve_dir() {
  local raw="$1"
  if [ -d "$raw" ]; then
    realpath "$raw"
  else
    realpath -m "$raw"
  fi
}

PROD_REAL="$(resolve_dir "$PROD_PUBLIC")"
STAGING_REAL="$(resolve_dir "$STAGING_PUBLIC")"

if [ "$PROD_REAL" = "$STAGING_REAL" ]; then
  echo "ABORTAR: o webroot de staging ($STAGING_REAL) e identico ao public_html de producao ($PROD_REAL)." >&2
  exit 1
fi

case "$STAGING_REAL/" in
  "$PROD_REAL/"*)
    echo "ABORTAR: o webroot de staging ($STAGING_REAL) esta DENTRO do public_html de producao ($PROD_REAL)." >&2
    echo "Mova a raiz de staging no hPanel para fora do public_html de producao antes de prosseguir." >&2
    exit 1
    ;;
esac

case "$PROD_REAL/" in
  "$STAGING_REAL/"*)
    echo "ABORTAR: o webroot de producao ($PROD_REAL) esta dentro do webroot de staging ($STAGING_REAL)." >&2
    exit 1
    ;;
esac

for priv_raw in "${PRIVATE_ARGS[@]}"; do
  if [ -z "$priv_raw" ]; then
    echo "ABORTAR: diretorio privado nao pode ser vazio." >&2
    exit 1
  fi
  PRIV_REAL="$(resolve_dir "$priv_raw")"
  for root in "$PROD_REAL" "$STAGING_REAL"; do
    case "$PRIV_REAL/" in
      "$root/"*)
        echo "ABORTAR: diretorio privado ($PRIV_REAL) esta DENTRO de webroot ($root)." >&2
        exit 1
        ;;
    esac
  done
  case "$PRIV_REAL" in
    */public_html|*/public_html/*|*/htdocs|*/htdocs/*|*/httpdocs|*/httpdocs/*|*/www|*/www/*)
      echo "ABORTAR: diretorio privado ($PRIV_REAL) contem segmento de webroot publico." >&2
      exit 1
      ;;
  esac
done

echo "LAYOUT OK: prod_public=$PROD_REAL | staging_public=$STAGING_REAL"
