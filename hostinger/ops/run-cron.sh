#!/usr/bin/env bash
set -euo pipefail
umask 077

LOG_DIR=""
JOB_NAME=""
MAX_BYTES=1048576
KEEP=5

while [ $# -gt 0 ]; do
  case "$1" in
    --log-dir=*)
      LOG_DIR="${1#*=}"
      shift
      ;;
    --name=*)
      JOB_NAME="${1#*=}"
      shift
      ;;
    --max-bytes=*)
      MAX_BYTES="${1#*=}"
      shift
      ;;
    --keep=*)
      KEEP="${1#*=}"
      shift
      ;;
    --)
      shift
      break
      ;;
    --help|-h)
      echo "Uso: $0 --log-dir=DIR --name=JOB [--max-bytes=1048576] [--keep=5] -- COMANDO [ARGS...]"
      exit 0
      ;;
    *)
      echo "Argumento nao reconhecido antes de --: $1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$LOG_DIR" ] || [ -z "$JOB_NAME" ] || [ $# -eq 0 ]; then
  echo "ERRO: informe --log-dir=..., --name=... e '-- COMANDO'." >&2
  exit 1
fi

case "$LOG_DIR" in
  */public_html|*/public_html/*|*/htdocs|*/htdocs/*|*/httpdocs|*/httpdocs/*|*/www|*/www/*)
    echo "ERRO: diretorio de log de cron nao pode estar em webroot publico ($LOG_DIR)." >&2
    exit 1
    ;;
esac

mkdir -p "$LOG_DIR"
chmod 700 "$LOG_DIR"
LOG_FILE="$LOG_DIR/cron-${JOB_NAME}.log"

rotate_log() {
  local current_size=0
  if [ -f "$LOG_FILE" ]; then
    current_size="$(wc -c < "$LOG_FILE" | tr -d ' ')"
  fi
  if [ "$current_size" -ge "$MAX_BYTES" ]; then
    local i
    for ((i = KEEP; i >= 2; i--)); do
      local prev=$((i - 1))
      if [ -f "${LOG_FILE}.${prev}" ]; then
        mv -f "${LOG_FILE}.${prev}" "${LOG_FILE}.${i}"
      fi
    done
    mv -f "$LOG_FILE" "${LOG_FILE}.1"
  fi
}

rotate_log

{
  printf '[%s] START %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$JOB_NAME"
  set +e
  "$@"
  STATUS=$?
  set -e
  printf '[%s] END %s exit=%d\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$JOB_NAME" "$STATUS"
} >> "$LOG_FILE" 2>&1

chmod 600 "$LOG_FILE" || true
exit "$STATUS"
