#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$SCRIPT_DIR/../ops" && pwd)"

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

assert_fail() {
  local label="$1"
  shift
  set +e
  "$@" >/dev/null 2>&1
  local rc=$?
  set -e
  if [ "$rc" -eq 0 ]; then
    echo "FAIL: esperado erro para '$label', mas retornou 0" >&2
    exit 1
  fi
  echo "PASS: $label (rc=$rc)"
}

# Prepara mocks de mysqldump/mysql no PATH
mkdir -p "$TMP_ROOT/bin"
cat > "$TMP_ROOT/bin/mysqldump" <<'EOF'
#!/usr/bin/env bash
echo "-- FAKE DUMP FOR $*"
echo "SELECT 1;"
EOF
cat > "$TMP_ROOT/bin/mysql" <<EOF
#!/usr/bin/env bash
if printf '%s\n' "\$*" | grep -q -- '-N'; then
  printf 'DROP TABLE IF EXISTS \`admin_login_locks\`;\n'
  printf 'DROP TABLE IF EXISTS \`security_alert_queue\`;\n'
  printf 'DROP TABLE IF EXISTS \`schema_migrations\`;\n'
  exit 0
fi
cat >> "$TMP_ROOT/mysql-restored.log"
EOF
chmod +x "$TMP_ROOT/bin/mysqldump" "$TMP_ROOT/bin/mysql"
export PATH="$TMP_ROOT/bin:$PATH"

MY_CNF="$TMP_ROOT/.my-migrator.cnf"
printf '[client]\nuser=migrator\npassword=test\n' > "$MY_CNF"
chmod 600 "$MY_CNF"

# Prepara diretorios separados de prod e staging
mkdir -p "$TMP_ROOT/prod/public_html/api" "$TMP_ROOT/prod/ajn-carreiras-private"
mkdir -p "$TMP_ROOT/staging/public_html/api" "$TMP_ROOT/staging/ajn-carreiras-private"
mkdir -p "$TMP_ROOT/backups" "$TMP_ROOT/logs"

for env_dir in prod staging; do
  printf 'Header always set X-Env "%s"\n' "$env_dir" > "$TMP_ROOT/$env_dir/public_html/.htaccess"
  printf '<html><body>v1-%s</body></html>\n' "$env_dir" > "$TMP_ROOT/$env_dir/public_html/index.html"
  printf '<?php // api %s\n' "$env_dir" > "$TMP_ROOT/$env_dir/public_html/api/index.php"
  printf '<?php // bootstrap %s\n' "$env_dir" > "$TMP_ROOT/$env_dir/ajn-carreiras-private/bootstrap.php"
done

# 1. check-layout.sh
assert_fail "check-layout rejeita staging dentro de prod/public_html" \
  "$OPS_DIR/check-layout.sh" \
  --prod-public="$TMP_ROOT/prod/public_html" \
  --staging-public="$TMP_ROOT/prod/public_html/staging"

assert_fail "check-layout rejeita diretorio privado dentro de webroot" \
  "$OPS_DIR/check-layout.sh" \
  --prod-public="$TMP_ROOT/prod/public_html" \
  --staging-public="$TMP_ROOT/staging/public_html" \
  --private-dir="$TMP_ROOT/staging/public_html/private"

"$OPS_DIR/check-layout.sh" \
  --prod-public="$TMP_ROOT/prod/public_html" \
  --staging-public="$TMP_ROOT/staging/public_html" \
  --private-dir="$TMP_ROOT/prod/ajn-carreiras-private" \
  --private-dir="$TMP_ROOT/staging/ajn-carreiras-private" >/dev/null
echo "PASS: check-layout aceita layout isolado"

# 2. backup.sh (LAST_STAMP separado + senha via stdin + sem vazar senha)
assert_fail "backup rejeita senha em argumento CLI" \
  "$OPS_DIR/backup.sh" --env=staging --target-base="$TMP_ROOT/staging" --backups-dir="$TMP_ROOT/backups" --skip-db --pass=insegura

unset BACKUP_PASSPHRASE || true
printf 'Staging#Secret!2026\n' | "$OPS_DIR/backup.sh" \
  --env=staging \
  --target-base="$TMP_ROOT/staging" \
  --backups-dir="$TMP_ROOT/backups" \
  --db-name=db_staging \
  --my-cnf="$MY_CNF" >/dev/null

printf 'Prod#Secret!2026\n' | "$OPS_DIR/backup.sh" \
  --env=prod \
  --target-base="$TMP_ROOT/prod" \
  --backups-dir="$TMP_ROOT/backups" \
  --db-name=db_prod \
  --my-cnf="$MY_CNF" >/dev/null

STAGING_STAMP="$(cat "$TMP_ROOT/backups/LAST_STAMP.staging")"
PROD_STAMP="$(cat "$TMP_ROOT/backups/LAST_STAMP.prod")"
[[ "$STAGING_STAMP" == staging-* ]]
[[ "$PROD_STAMP" == prod-* ]]

if grep -R -q 'Secret!2026' "$TMP_ROOT/backups"; then
  echo "FAIL: passphrase vazou no diretorio de backups" >&2
  exit 1
fi
echo "PASS: backup gerou LAST_STAMP.staging e LAST_STAMP.prod sem gravar passphrase"

# 3. rollback.sh (aborta em ambiente trocado e restaura no correto)
printf '<html><body>BROKEN-STAGING</body></html>\n' > "$TMP_ROOT/staging/public_html/index.html"
printf '<html><body>BROKEN-PROD</body></html>\n' > "$TMP_ROOT/prod/public_html/index.html"

assert_fail "rollback prod aborta ao apontar TARGET_BASE de staging" \
  bash -c "printf 'Prod#Secret!2026\n' | '$OPS_DIR/rollback.sh' prod --target-base='$TMP_ROOT/staging' --backups-dir='$TMP_ROOT/backups'"

assert_fail "rollback staging aborta ao apontar TARGET_BASE de prod" \
  bash -c "printf 'Staging#Secret!2026\n' | '$OPS_DIR/rollback.sh' staging --target-base='$TMP_ROOT/prod' --backups-dir='$TMP_ROOT/backups'"

assert_fail "rollback staging aborta quando STAMP tem prefixo prod-" \
  bash -c "printf 'Staging#Secret!2026\n' | '$OPS_DIR/rollback.sh' staging --stamp='$PROD_STAMP' --target-base='$TMP_ROOT/staging' --backups-dir='$TMP_ROOT/backups'"

printf 'Staging#Secret!2026\n' | "$OPS_DIR/rollback.sh" staging \
  --target-base="$TMP_ROOT/staging" \
  --backups-dir="$TMP_ROOT/backups" \
  --db-name=db_staging \
  --my-cnf="$MY_CNF" >/dev/null

grep -q 'v1-staging' "$TMP_ROOT/staging/public_html/index.html"
grep -q 'DROP TABLE IF EXISTS `schema_migrations`;' "$TMP_ROOT/mysql-restored.log"
grep -q 'DROP TABLE IF EXISTS `admin_login_locks`;' "$TMP_ROOT/mysql-restored.log"
grep -q 'DROP TABLE IF EXISTS `security_alert_queue`;' "$TMP_ROOT/mysql-restored.log"
grep -q 'db_staging' "$TMP_ROOT/mysql-restored.log"

printf 'Prod#Secret!2026\n' | "$OPS_DIR/rollback.sh" prod \
  --target-base="$TMP_ROOT/prod" \
  --backups-dir="$TMP_ROOT/backups" \
  --db-name=db_prod \
  --my-cnf="$MY_CNF" >/dev/null

grep -q 'v1-prod' "$TMP_ROOT/prod/public_html/index.html"
grep -q 'db_prod' "$TMP_ROOT/mysql-restored.log"
echo "PASS: rollback atomic mv + drop-all tables antes do dump + validacao de ambiente/stamp"

# 3b. env.sh e validacao de variaveis vazias nos wrappers
if grep -qE 'secret|password|token|PASSPHRASE|ENCRYPTION_KEY' "$OPS_DIR/env.sh"; then
  echo "FAIL: env.sh nao pode conter segredos" >&2
  exit 1
fi

bash -c "
  set -euo pipefail
  export PROD_PUBLIC='$TMP_ROOT/prod/public_html'
  export STG_PUBLIC='$TMP_ROOT/staging/public_html'
  export PROD_PRIVATE='$TMP_ROOT/prod/ajn-carreiras-private'
  export STG_PRIVATE='$TMP_ROOT/staging/ajn-carreiras-private'
  export STG_HTPASSWD='$TMP_ROOT/staging/.htpasswd-staging'
  export PHP_BIN='$(command -v bash)'
  source '$OPS_DIR/env.sh'
  '$OPS_DIR/check-layout.sh' >/dev/null
  '$OPS_DIR/check-public-diff.sh' --env=staging --package-public='$TMP_ROOT/staging/public_html' >/dev/null
"

for empty_var in PROD_PUBLIC STG_PUBLIC PROD_PRIVATE STG_PRIVATE STG_HTPASSWD PHP_BIN; do
  assert_fail "env.sh aborta se ${empty_var} vier vazia" \
    bash -c "
      export PROD_PUBLIC='$TMP_ROOT/prod/public_html'
      export STG_PUBLIC='$TMP_ROOT/staging/public_html'
      export PROD_PRIVATE='$TMP_ROOT/prod/ajn-carreiras-private'
      export STG_PRIVATE='$TMP_ROOT/staging/ajn-carreiras-private'
      export STG_HTPASSWD='$TMP_ROOT/staging/.htpasswd-staging'
      export PHP_BIN='$(command -v bash)'
      export ${empty_var}=''
      source '$OPS_DIR/env.sh'
    "
done

assert_fail "check-layout rejeita --private-dir vazio" \
  "$OPS_DIR/check-layout.sh" --prod-public="$TMP_ROOT/prod/public_html" --staging-public="$TMP_ROOT/staging/public_html" --private-dir=""
assert_fail "backup rejeita --public-dir vazio" \
  "$OPS_DIR/backup.sh" --env=staging --public-dir="" --private-dir="$TMP_ROOT/staging/ajn-carreiras-private" --skip-db
assert_fail "rollback rejeita --stamp vazio" \
  "$OPS_DIR/rollback.sh" staging --target-base="$TMP_ROOT/staging" --stamp="" --backups-dir="$TMP_ROOT/backups"
echo "PASS: env.sh sem segredos + wrappers aceitam env.sh e abortam em variavel vazia"

# 4. check-public-diff.sh
mkdir -p "$TMP_ROOT/curr_pub/.well-known/acme-challenge" "$TMP_ROOT/curr_pub/subapp" "$TMP_ROOT/pkg_pub/.well-known"
printf 'token' > "$TMP_ROOT/curr_pub/.well-known/acme-challenge/tok1"
printf 'google-site-verification' > "$TMP_ROOT/curr_pub/google12345.html"
printf 'subapp' > "$TMP_ROOT/curr_pub/subapp/index.html"
printf 'sec' > "$TMP_ROOT/curr_pub/.well-known/security.txt"
printf 'sec' > "$TMP_ROOT/pkg_pub/.well-known/security.txt"

set +e
DIFF_OUT="$("$OPS_DIR/check-public-diff.sh" --current-public="$TMP_ROOT/curr_pub" --package-public="$TMP_ROOT/pkg_pub" 2>&1)"
DIFF_RC=$?
set -e
if [ "$DIFF_RC" -ne 2 ]; then
  echo "FAIL: check-public-diff deveria sair 2 com extras, saiu $DIFF_RC" >&2
  exit 1
fi
printf '%s\n' "$DIFF_OUT" | grep -q '\.well-known/acme-challenge/tok1'
printf '%s\n' "$DIFF_OUT" | grep -q 'google12345.html'
printf '%s\n' "$DIFF_OUT" | grep -q 'subapp'

"$OPS_DIR/check-public-diff.sh" --current-public="$TMP_ROOT/pkg_pub" --package-public="$TMP_ROOT/pkg_pub" >/dev/null
echo "PASS: check-public-diff detectou extras (.well-known/acme-challenge, verificacao e subapp)"

# 5. run-cron.sh (rejeita webroot, preserva exit code e rotaciona logs)
assert_fail "run-cron rejeita diretorio de log dentro de public_html" \
  "$OPS_DIR/run-cron.sh" --log-dir="$TMP_ROOT/prod/public_html/logs" --name=bad -- true

set +e
"$OPS_DIR/run-cron.sh" --log-dir="$TMP_ROOT/logs" --name=failjob --max-bytes=40 --keep=3 -- bash -c 'echo "erro-critico-cron"; exit 42'
FAIL_RC=$?
set -e
if [ "$FAIL_RC" -ne 42 ]; then
  echo "FAIL: run-cron deveria preservar exit=42, obteve $FAIL_RC" >&2
  exit 1
fi

"$OPS_DIR/run-cron.sh" --log-dir="$TMP_ROOT/logs" --name=failjob --max-bytes=40 --keep=3 -- bash -c 'echo "execucao-2"'
"$OPS_DIR/run-cron.sh" --log-dir="$TMP_ROOT/logs" --name=failjob --max-bytes=40 --keep=3 -- bash -c 'echo "execucao-3"'
test -f "$TMP_ROOT/logs/cron-failjob.log"
test -f "$TMP_ROOT/logs/cron-failjob.log.1"
echo "PASS: run-cron registrou logs fora de webroot, preservou exit!=0 e rotacionou"
echo "OPS_SMOKE_ALL_PASS"
