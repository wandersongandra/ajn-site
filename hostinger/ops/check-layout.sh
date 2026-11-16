#!/usr/bin/env bash
set -euo pipefail

PROD_PUBLIC=""
STAGING_PUBLIC=""
PRIVATE_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --prod-public=*)
      PROD_PUBLIC="${arg#*=}"
      ;;
    --staging-public=*)
      STAGING_PUBLIC="${arg#*=}"
      ;;
    --private-dir=*)
      PRIVATE_ARGS+=("${arg#*=}")
      ;;
    --help|-h)
      echo "Uso: $0 --prod-public=DIR --staging-public=DIR [--private-dir=DIR ...]"
      exit 0
      ;;
    *)
      echo "Argumento nao reconhecido: $arg" >&2
      exit 1
      ;;
  esac
done

if [ -z "$PROD_PUBLIC" ] || [ -z "$STAGING_PUBLIC" ]; then
  echo "Informe --prod-public=... e --staging-public=..." >&2
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
  [ -z "$priv_raw" ] && continue
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
