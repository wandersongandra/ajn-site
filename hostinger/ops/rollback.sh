#!/usr/bin/env bash
set -euo pipefail
umask 077

ENV_NAME=""
if [ $# -ge 1 ] && [ "${1#--}" = "$1" ]; then
  ENV_NAME="$1"
  shift
fi

TARGET_BASE=""
PUBLIC_DIR=""
PRIVATE_DIR=""
BACKUPS_DIR="${HOME:-/tmp}/backups"
STAMP=""
DB_NAME=""
MY_CNF="${HOME:-/tmp}/.my-migrator.cnf"

for arg in "$@"; do
  case "$arg" in
    --env=*)
      ENV_NAME="${arg#*=}"
      ;;
    --target-base=*)
      TARGET_BASE="${arg#*=}"
      ;;
    --public-dir=*)
      PUBLIC_DIR="${arg#*=}"
      ;;
    --private-dir=*)
      PRIVATE_DIR="${arg#*=}"
      ;;
    --backups-dir=*)
      BACKUPS_DIR="${arg#*=}"
      ;;
    --stamp=*)
      STAMP="${arg#*=}"
      ;;
    --db-name=*)
      DB_NAME="${arg#*=}"
      ;;
    --my-cnf=*)
      MY_CNF="${arg#*=}"
      ;;
    --pass=*|--password=*|-p=*)
      echo "ERRO: nunca passe a senha de backup em argumentos CLI. Use read -s para BACKUP_PASSPHRASE." >&2
      exit 1
      ;;
    --help|-h)
      echo "Uso: $0 <staging|prod> [--target-base=DIR | --public-dir=DIR --private-dir=DIR] [--stamp=STAMP] [--db-name=DB] [--my-cnf=PATH] [--backups-dir=DIR]"
      exit 0
      ;;
    *)
      echo "Argumento nao reconhecido: $arg" >&2
      exit 1
      ;;
  esac
done

if [ "$ENV_NAME" != "staging" ] && [ "$ENV_NAME" != "prod" ]; then
  echo "ERRO: informe o ambiente 'staging' ou 'prod' como primeiro argumento ou --env=." >&2
  exit 1
fi

if [ -n "$TARGET_BASE" ]; then
  [ -z "$PUBLIC_DIR" ] && PUBLIC_DIR="$TARGET_BASE/public_html"
  [ -z "$PRIVATE_DIR" ] && PRIVATE_DIR="$TARGET_BASE/ajn-carreiras-private"
fi

if [ -z "$PUBLIC_DIR" ] || [ -z "$PRIVATE_DIR" ]; then
  echo "ERRO: informe --target-base (ou --public-dir e --private-dir)." >&2
  exit 1
fi

LAST_STAMP_FILE="$BACKUPS_DIR/LAST_STAMP.${ENV_NAME}"
if [ -z "$STAMP" ]; then
  if [ ! -f "$LAST_STAMP_FILE" ]; then
    echo "ERRO: arquivo LAST_STAMP nao encontrado para ambiente '${ENV_NAME}': $LAST_STAMP_FILE" >&2
    exit 1
  fi
  STAMP="$(tr -d ' \r\n\t' < "$LAST_STAMP_FILE")"
fi

if [ -z "$STAMP" ]; then
  echo "ERRO: STAMP vazio." >&2
  exit 1
fi

STAMP_PREFIX="${STAMP%%-*}"
if [ "$STAMP_PREFIX" != "$ENV_NAME" ]; then
  echo "ABORTAR: prefixo do STAMP ('$STAMP_PREFIX' em '$STAMP') nao corresponde ao ambiente '$ENV_NAME'." >&2
  exit 1
fi

has_staging_segment() {
  local lc
  lc="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  [[ "$lc" =~ (^|/)[^/]*staging[^/]*(/|$) ]]
}

has_prod_segment() {
  local lc
  lc="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  [[ "$lc" =~ (^|/)[^/]*prod(ucao)?[^/]*(/|$) ]]
}

TARGET_DESC="${TARGET_BASE:-$PUBLIC_DIR | $PRIVATE_DIR}"

if [ "$STAMP_PREFIX" = "prod" ]; then
  if { [ -n "$TARGET_BASE" ] && has_staging_segment "$TARGET_BASE"; } || has_staging_segment "$PUBLIC_DIR" || has_staging_segment "$PRIVATE_DIR"; then
    echo "ABORTAR: STAMP de producao ($STAMP) nao pode ser restaurado em TARGET_BASE de staging ($TARGET_DESC)." >&2
    exit 1
  fi
fi

if [ "$STAMP_PREFIX" = "staging" ]; then
  if { [ -n "$TARGET_BASE" ] && has_prod_segment "$TARGET_BASE"; } || has_prod_segment "$PUBLIC_DIR" || has_prod_segment "$PRIVATE_DIR"; then
    echo "ABORTAR: STAMP de staging ($STAMP) nao pode ser restaurado em TARGET_BASE de producao ($TARGET_DESC)." >&2
    exit 1
  fi
  if ! has_staging_segment "${TARGET_BASE:-}" && ! has_staging_segment "$PUBLIC_DIR" && ! has_staging_segment "$PRIVATE_DIR"; then
    echo "ABORTAR: STAMP de staging ($STAMP) recusado porque TARGET_BASE nao identifica ambiente staging ($TARGET_DESC)." >&2
    exit 1
  fi
fi

PUBLIC_ARCHIVE="$BACKUPS_DIR/public-${STAMP}.tar.gz.enc"
PRIVATE_ARCHIVE="$BACKUPS_DIR/private-${STAMP}.tar.gz.enc"
DB_ARCHIVE="$BACKUPS_DIR/db-${STAMP}.sql.gz.enc"

if [ ! -s "$PUBLIC_ARCHIVE" ] || [ ! -s "$PRIVATE_ARCHIVE" ]; then
  echo "ERRO: arquivos de backup ausentes para STAMP=${STAMP}: $PUBLIC_ARCHIVE / $PRIVATE_ARCHIVE" >&2
  exit 1
fi

if [ -n "$DB_NAME" ]; then
  if [ ! -s "$DB_ARCHIVE" ]; then
    echo "ERRO: backup de banco ausente para STAMP=${STAMP}: $DB_ARCHIVE" >&2
    exit 1
  fi
  if [ ! -f "$MY_CNF" ]; then
    echo "ERRO: credenciais do migrator ausentes: $MY_CNF" >&2
    exit 1
  fi
fi

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  printf 'Senha de cifragem do backup (%s, STAMP=%s): ' "$ENV_NAME" "$STAMP" >&2
  IFS= read -r -s BACKUP_PASSPHRASE
  printf '\n' >&2
  export BACKUP_PASSPHRASE
fi

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  echo "ERRO: senha de backup vazia." >&2
  exit 1
fi

if [ -d "$PRIVATE_DIR" ]; then
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "$PRIVATE_DIR/maintenance.flag"
  chmod 640 "$PRIVATE_DIR/maintenance.flag" || true
fi

RESTORE_TMP="$(mktemp -d "${BACKUPS_DIR}/restore-${STAMP}-XXXXXX")"
cleanup_tmp() {
  rm -rf "$RESTORE_TMP"
}
trap cleanup_tmp EXIT

mkdir -p "$RESTORE_TMP/public" "$RESTORE_TMP/private"
chmod 700 "$RESTORE_TMP" "$RESTORE_TMP/private"

openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$PUBLIC_ARCHIVE" \
  | tar -xzf - -C "$RESTORE_TMP/public"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$PRIVATE_ARCHIVE" \
  | tar -xzf - -C "$RESTORE_TMP/private"

for required_pub in ".htaccess" "index.html" "api/index.php"; do
  if [ ! -f "$RESTORE_TMP/public/$required_pub" ]; then
    echo "ERRO: arquivo obrigatorio ausente no backup extraido (public/$required_pub). Abortando antes de alterar o servidor." >&2
    exit 1
  fi
done
if [ ! -f "$RESTORE_TMP/private/bootstrap.php" ]; then
  echo "ERRO: arquivo obrigatorio ausente no backup extraido (private/bootstrap.php). Abortando antes de alterar o servidor." >&2
  exit 1
fi

if [ -n "$DB_NAME" ]; then
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$DB_ARCHIVE" | gzip -t
fi

mkdir -p "$(dirname "$PUBLIC_DIR")" "$(dirname "$PRIVATE_DIR")"

if [ -d "$PUBLIC_DIR" ]; then
  mv "$PUBLIC_DIR" "${PUBLIC_DIR}.failed.${STAMP}"
fi
mv "$RESTORE_TMP/public" "$PUBLIC_DIR"

if [ -d "$PRIVATE_DIR" ]; then
  mv "$PRIVATE_DIR" "${PRIVATE_DIR}.failed.${STAMP}"
fi
mv "$RESTORE_TMP/private" "$PRIVATE_DIR"

if [ -n "$DB_NAME" ]; then
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$DB_ARCHIVE" \
    | gunzip \
    | mysql --defaults-extra-file="$MY_CNF" "$DB_NAME"
fi

rm -f "$PRIVATE_DIR/maintenance.flag"
echo "ROLLBACK CONCLUIDO (${ENV_NAME}): STAMP=${STAMP} | PUBLIC=${PUBLIC_DIR} | PRIVATE=${PRIVATE_DIR}"
