#!/usr/bin/env bash
set -euo pipefail
umask 077

ENV_NAME=""
ENV_FILE=""
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
DB_DRIVER="mysql"
MY_CNF="${HOME:-/tmp}/.my-migrator.cnf"

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
    --stamp=*)
      STAMP="${arg#*=}"
      [ -n "$STAMP" ] || { echo "ERRO: --stamp nao pode ser vazio." >&2; exit 1; }
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
    --pass=*|--password=*|-p=*)
      echo "ERRO: nunca passe a senha de backup em argumentos CLI. Use read -s para BACKUP_PASSPHRASE." >&2
      exit 1
      ;;
    --help|-h)
      echo "Uso: $0 <staging|prod> [--env-file=PATH] [--target-base=DIR | --public-dir=DIR --private-dir=DIR] [--stamp=STAMP] [--db-name=DB] [--db-driver=mysql|sqlite] [--my-cnf=PATH] [--backups-dir=DIR]"
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
  echo "ERRO: informe o ambiente 'staging' ou 'prod' como primeiro argumento ou --env=." >&2
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
  echo "ERRO: informe --target-base (ou --public-dir e --private-dir / env.sh)." >&2
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
  if [ "$DB_DRIVER" = "mysql" ]; then
    if [ ! -f "$MY_CNF" ]; then
      echo "ERRO: credenciais do migrator ausentes: $MY_CNF" >&2
      exit 1
    fi
  else
    if ! command -v sqlite3 >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
      echo "ERRO: sqlite3 ou python3 necessario para rollback SQLite." >&2
      exit 1
    fi
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
  if [ "$DB_DRIVER" = "mysql" ]; then
    DROP_SQL="$(
      mysql --defaults-extra-file="$MY_CNF" -N -B -e \
        "SELECT CONCAT('DROP ', IF(TABLE_TYPE='VIEW','VIEW','TABLE'), ' IF EXISTS ', CHAR(96), REPLACE(TABLE_NAME, CHAR(96), CONCAT(CHAR(96), CHAR(96))), CHAR(96), ';') FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY CASE WHEN TABLE_TYPE='VIEW' THEN 0 ELSE 1 END, TABLE_NAME;" \
        "$DB_NAME"
    )"
    {
      printf 'SET FOREIGN_KEY_CHECKS = 0;\n'
      if [ -n "$DROP_SQL" ]; then
        printf '%s\n' "$DROP_SQL"
      fi
      openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$DB_ARCHIVE" | gunzip
      printf '\nSET FOREIGN_KEY_CHECKS = 1;\n'
    } | mysql --defaults-extra-file="$MY_CNF" "$DB_NAME"
  else
    DB_RESTORE_SQL="$RESTORE_TMP/restore.sql"
    openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$DB_ARCHIVE" | gunzip > "$DB_RESTORE_SQL"
    if command -v python3 >/dev/null 2>&1; then
      python3 - "$DB_NAME" "$DB_RESTORE_SQL" <<'PYEOF'
import sqlite3
import sys

db_path = sys.argv[1]
sql_path = sys.argv[2]
with open(sql_path, 'r', encoding='utf-8') as f:
    dump_sql = f.read()

conn = sqlite3.connect(db_path)
try:
    conn.execute('PRAGMA foreign_keys = OFF')
    rows = conn.execute(
        "SELECT type, name FROM sqlite_master "
        "WHERE type IN ('view','trigger','index','table') AND name NOT LIKE 'sqlite_%' "
        "ORDER BY CASE type WHEN 'view' THEN 0 WHEN 'trigger' THEN 1 WHEN 'index' THEN 2 ELSE 3 END, name"
    ).fetchall()
    for obj_type, obj_name in rows:
        escaped = obj_name.replace('"', '""')
        conn.execute(f'DROP {obj_type.upper()} IF EXISTS "{escaped}"')
    has_seq = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'").fetchone()
    if has_seq:
        conn.execute('DELETE FROM sqlite_sequence')
    conn.commit()
    conn.executescript(dump_sql)
    conn.commit()
finally:
    conn.close()
PYEOF
    else
      DROP_SQLITE="$(sqlite3 -noheader -list "$DB_NAME" "SELECT 'DROP ' || UPPER(type) || ' IF EXISTS \"' || REPLACE(name, '\"', '\"\"') || '\";' FROM sqlite_master WHERE type IN ('view','trigger','index','table') AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'view' THEN 0 WHEN 'trigger' THEN 1 WHEN 'index' THEN 2 ELSE 3 END, name;")"
      {
        printf 'PRAGMA foreign_keys = OFF;\n'
        [ -n "$DROP_SQLITE" ] && printf '%s\n' "$DROP_SQLITE"
        cat "$DB_RESTORE_SQL"
      } | sqlite3 "$DB_NAME"
    fi
  fi
fi

rm -f "$PRIVATE_DIR/maintenance.flag"
echo "ROLLBACK CONCLUIDO (${ENV_NAME}): STAMP=${STAMP} | PUBLIC=${PUBLIC_DIR} | PRIVATE=${PRIVATE_DIR}"
