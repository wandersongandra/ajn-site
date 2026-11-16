#!/usr/bin/env bash
set -euo pipefail
umask 077

ENV_NAME=""
ENV_FILE=""
TARGET_BASE=""
PUBLIC_DIR=""
PRIVATE_DIR=""
BACKUPS_DIR="${HOME:-/tmp}/backups"
DB_NAME=""
DB_DRIVER="mysql"
MY_CNF="${HOME:-/tmp}/.my-migrator.cnf"
SKIP_DB=0

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
    --target-base=*)
      TARGET_BASE="${arg#*=}"
      [ -n "$TARGET_BASE" ] || { echo "ERRO: --target-base nao pode ser vazio." >&2; exit 1; }
      ;;
    --public-dir=*)
      PUBLIC_DIR="${arg#*=}"
      [ -n "$PUBLIC_DIR" ] || { echo "ERRO: --public-dir nao pode ser vazio." >&2; exit 1; }
      ;;
    --private-dir=*)
      PRIVATE_DIR="${arg#*=}"
      [ -n "$PRIVATE_DIR" ] || { echo "ERRO: --private-dir nao pode ser vazio." >&2; exit 1; }
      ;;
    --backups-dir=*)
      BACKUPS_DIR="${arg#*=}"
      [ -n "$BACKUPS_DIR" ] || { echo "ERRO: --backups-dir nao pode ser vazio." >&2; exit 1; }
      ;;
    --db-name=*)
      DB_NAME="${arg#*=}"
      [ -n "$DB_NAME" ] || { echo "ERRO: --db-name nao pode ser vazio." >&2; exit 1; }
      ;;
    --db-driver=*)
      DB_DRIVER="${arg#*=}"
      [ -n "$DB_DRIVER" ] || { echo "ERRO: --db-driver nao pode ser vazio." >&2; exit 1; }
      ;;
    --my-cnf=*)
      MY_CNF="${arg#*=}"
      [ -n "$MY_CNF" ] || { echo "ERRO: --my-cnf nao pode ser vazio." >&2; exit 1; }
      ;;
    --skip-db)
      SKIP_DB=1
      ;;
    --pass=*|--password=*|-p=*)
      echo "ERRO: nunca passe a senha de backup em argumentos CLI. Use read -s para BACKUP_PASSPHRASE." >&2
      exit 1
      ;;
    --help|-h)
      echo "Uso: $0 --env=staging|prod [--env-file=PATH] [--target-base=DIR | --public-dir=DIR --private-dir=DIR] [--db-name=DB] [--db-driver=mysql|sqlite] [--my-cnf=PATH] [--backups-dir=DIR] [--skip-db]"
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

if [ "$ENV_NAME" != "staging" ] && [ "$ENV_NAME" != "prod" ]; then
  echo "ERRO: --env deve ser exatamente 'staging' ou 'prod'." >&2
  exit 1
fi

if [ "$DB_DRIVER" != "mysql" ] && [ "$DB_DRIVER" != "sqlite" ]; then
  echo "ERRO: --db-driver deve ser 'mysql' ou 'sqlite' (recebido: $DB_DRIVER)." >&2
  exit 1
fi

if [ -n "$TARGET_BASE" ]; then
  [ -z "$PUBLIC_DIR" ] && PUBLIC_DIR="$TARGET_BASE/public_html"
  [ -z "$PRIVATE_DIR" ] && PRIVATE_DIR="$TARGET_BASE/ajn-carreiras-private"
else
  if [ "$ENV_NAME" = "staging" ]; then
    [ -z "$PUBLIC_DIR" ] && PUBLIC_DIR="${STG_PUBLIC:-}"
    [ -z "$PRIVATE_DIR" ] && PRIVATE_DIR="${STG_PRIVATE:-}"
  else
    [ -z "$PUBLIC_DIR" ] && PUBLIC_DIR="${PROD_PUBLIC:-}"
    [ -z "$PRIVATE_DIR" ] && PRIVATE_DIR="${PROD_PRIVATE:-}"
  fi
fi

if [ -z "$PUBLIC_DIR" ] || [ -z "$PRIVATE_DIR" ]; then
  echo "ERRO: informe --public-dir e --private-dir (ou --target-base / env.sh)." >&2
  exit 1
fi

if [ ! -d "$PUBLIC_DIR" ]; then
  echo "ERRO: public_dir inexistente: $PUBLIC_DIR" >&2
  exit 1
fi
if [ ! -d "$PRIVATE_DIR" ]; then
  echo "ERRO: private_dir inexistente: $PRIVATE_DIR" >&2
  exit 1
fi

PUBLIC_REAL="$(realpath "$PUBLIC_DIR")"
PRIVATE_REAL="$(realpath "$PRIVATE_DIR")"

case "$PRIVATE_REAL/" in
  "$PUBLIC_REAL/"*)
    echo "ERRO: private_dir ($PRIVATE_REAL) nao pode ficar dentro de public_dir ($PUBLIC_REAL)." >&2
    exit 1
    ;;
esac

has_staging_segment() {
  local lc
  lc="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  [[ "$lc" =~ (^|/)[^/]*staging[^/]*(/|$) ]]
}

if [ "$ENV_NAME" = "prod" ]; then
  if has_staging_segment "$PUBLIC_REAL" || has_staging_segment "$PRIVATE_REAL" || { [ -n "$TARGET_BASE" ] && has_staging_segment "$TARGET_BASE"; }; then
    echo "ABORTAR: --env=prod recusado porque um dos caminhos aponta para staging ($PUBLIC_REAL | $PRIVATE_REAL)." >&2
    exit 1
  fi
fi

if [ "$ENV_NAME" = "staging" ]; then
  if ! has_staging_segment "$PUBLIC_REAL" && ! has_staging_segment "$PRIVATE_REAL" && { [ -z "$TARGET_BASE" ] || ! has_staging_segment "$TARGET_BASE"; }; then
    echo "ABORTAR: --env=staging recusado porque os caminhos informados nao identificam staging ($PUBLIC_REAL | $PRIVATE_REAL)." >&2
    exit 1
  fi
fi

if [ "$SKIP_DB" -eq 0 ] && [ -n "$DB_NAME" ]; then
  if [ "$DB_DRIVER" = "mysql" ]; then
    if [ ! -f "$MY_CNF" ]; then
      echo "ERRO: arquivo de credenciais do migrator ausente: $MY_CNF" >&2
      exit 1
    fi
  else
    if [ ! -f "$DB_NAME" ]; then
      echo "ERRO: arquivo SQLite inexistente: $DB_NAME" >&2
      exit 1
    fi
    if ! command -v sqlite3 >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
      echo "ERRO: sqlite3 ou python3 necessario para backup SQLite." >&2
      exit 1
    fi
  fi
fi

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  printf 'Senha de cifragem do backup (%s, guarde apenas no seu gerenciador de senhas): ' "$ENV_NAME" >&2
  IFS= read -r -s BACKUP_PASSPHRASE
  printf '\n' >&2
  export BACKUP_PASSPHRASE
fi

if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  echo "ERRO: senha de backup vazia." >&2
  exit 1
fi

mkdir -p "$BACKUPS_DIR"
chmod 700 "$BACKUPS_DIR"

STAMP="${ENV_NAME}-$(date -u +%Y%m%dT%H%M%SZ)-$$"
LAST_STAMP_FILE="$BACKUPS_DIR/LAST_STAMP.${ENV_NAME}"

PUBLIC_ARCHIVE="$BACKUPS_DIR/public-${STAMP}.tar.gz.enc"
PRIVATE_ARCHIVE="$BACKUPS_DIR/private-${STAMP}.tar.gz.enc"
META_FILE="$BACKUPS_DIR/meta-${STAMP}.env"

tar -czf - -C "$PUBLIC_REAL" . \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE -out "$PUBLIC_ARCHIVE"
test -s "$PUBLIC_ARCHIVE"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$PUBLIC_ARCHIVE" | gzip -t

tar -czf - -C "$PRIVATE_REAL" . \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE -out "$PRIVATE_ARCHIVE"
test -s "$PRIVATE_ARCHIVE"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$PRIVATE_ARCHIVE" | gzip -t

DB_STATUS="skipped"
if [ "$SKIP_DB" -eq 0 ] && [ -n "$DB_NAME" ]; then
  DB_ARCHIVE="$BACKUPS_DIR/db-${STAMP}.sql.gz.enc"
  if [ "$DB_DRIVER" = "mysql" ]; then
    mysqldump --defaults-extra-file="$MY_CNF" --single-transaction --routines --triggers "$DB_NAME" \
      | gzip -9 \
      | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE -out "$DB_ARCHIVE"
  elif command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_NAME" .dump \
      | gzip -9 \
      | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE -out "$DB_ARCHIVE"
  else
    python3 -c 'import sqlite3,sys; conn=sqlite3.connect(sys.argv[1]); print("\n".join(conn.iterdump())); conn.close()' "$DB_NAME" \
      | gzip -9 \
      | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE -out "$DB_ARCHIVE"
  fi
  test -s "$DB_ARCHIVE"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$DB_ARCHIVE" | gzip -t
  DB_STATUS="$DB_ARCHIVE"
fi

{
  printf 'ENV_NAME=%q\n' "$ENV_NAME"
  printf 'DB_DRIVER=%q\n' "$DB_DRIVER"
  printf 'STAMP=%q\n' "$STAMP"
  printf 'PUBLIC_REAL=%q\n' "$PUBLIC_REAL"
  printf 'PRIVATE_REAL=%q\n' "$PRIVATE_REAL"
} > "$META_FILE"
chmod 600 "$META_FILE"

TMP_STAMP="${LAST_STAMP_FILE}.tmp.$$"
printf '%s\n' "$STAMP" > "$TMP_STAMP"
chmod 600 "$TMP_STAMP"
mv -f "$TMP_STAMP" "$LAST_STAMP_FILE"

echo "BACKUP VERIFICADO (${ENV_NAME}): STAMP=${STAMP} LAST_STAMP=${LAST_STAMP_FILE} PUBLIC=${PUBLIC_ARCHIVE} PRIVATE=${PRIVATE_ARCHIVE} DB=${DB_STATUS}"
