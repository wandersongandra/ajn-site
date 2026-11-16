#!/usr/bin/env bash
set -euo pipefail

ENV_NAME=""
ENV_FILE=""
CURRENT_PUBLIC=""
PACKAGE_PUBLIC=""

for arg in "$@"; do
  case "$arg" in
    --env-file=*)
      ENV_FILE="${arg#*=}"
      [ -n "$ENV_FILE" ] || { echo "ERRO: --env-file nao pode ser vazio." >&2; exit 1; }
      ;;
    --env=*)
      ENV_NAME="${arg#*=}"
      [ -n "$ENV_NAME" ] || { echo "ERRO: --env nao pode ser vazio." >&2; exit 1; }
      ;;
    --current-public=*)
      CURRENT_PUBLIC="${arg#*=}"
      [ -n "$CURRENT_PUBLIC" ] || { echo "ERRO: --current-public nao pode ser vazio." >&2; exit 1; }
      ;;
    --package-public=*)
      PACKAGE_PUBLIC="${arg#*=}"
      [ -n "$PACKAGE_PUBLIC" ] || { echo "ERRO: --package-public nao pode ser vazio." >&2; exit 1; }
      ;;
    --help|-h)
      echo "Uso: $0 [--env-file=PATH] [--env=staging|prod] --current-public=DIR --package-public=DIR"
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
fi

if [ -z "$CURRENT_PUBLIC" ] && [ -n "$ENV_NAME" ]; then
  case "$ENV_NAME" in
    prod) CURRENT_PUBLIC="${PROD_PUBLIC:-}" ;;
    staging) CURRENT_PUBLIC="${STG_PUBLIC:-}" ;;
    *)
      echo "ERRO: --env invalido: $ENV_NAME" >&2
      exit 1
      ;;
  esac
fi

if [ -z "$CURRENT_PUBLIC" ] || [ -z "$PACKAGE_PUBLIC" ]; then
  echo "Informe --current-public=... e --package-public=..." >&2
  exit 1
fi

if [ ! -d "$CURRENT_PUBLIC" ] || [ ! -d "$PACKAGE_PUBLIC" ]; then
  echo "Diretorio invalido: current=$CURRENT_PUBLIC package=$PACKAGE_PUBLIC" >&2
  exit 1
fi

EXTRAS=()
while IFS= read -r -d '' entry; do
  name="$(basename "$entry")"
  [ "$name" = "." ] || [ "$name" = ".." ] && continue
  if [ ! -e "$PACKAGE_PUBLIC/$name" ]; then
    EXTRAS+=("$name")
  fi
done < <(find "$CURRENT_PUBLIC" -mindepth 1 -maxdepth 1 -print0 | sort -z)

if [ -d "$CURRENT_PUBLIC/.well-known" ]; then
  while IFS= read -r -d '' entry; do
    rel="${entry#"$CURRENT_PUBLIC"/}"
    if [ ! -e "$PACKAGE_PUBLIC/$rel" ]; then
      EXTRAS+=("$rel")
    fi
  done < <(find "$CURRENT_PUBLIC/.well-known" -mindepth 1 -maxdepth 4 -print0 | sort -z)
fi

if [ "${#EXTRAS[@]}" -eq 0 ]; then
  echo "DIFF PUBLIC_HTML: nenhum item extra no public_html atual fora do pacote."
  exit 0
fi

echo "ATENCAO: os itens abaixo existem no public_html ATUAL e NAO estao no pacote:"
for item in "${EXTRAS[@]}"; do
  echo "  - $item"
done
echo "PARE e confirme com o usuario o que deve ser copiado para public_html.next antes do mv."
exit 2
