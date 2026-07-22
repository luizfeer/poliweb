#!/usr/bin/env bash
set -euo pipefail

REPO="/home/ubuntu/projects/hail-mary"
LOG_DIR="$REPO/.Codex/scheduled"
STATUS_LOG="$LOG_DIR/verify-create-artes-ia-$(date -u +%Y%m%dT%H%M%SZ).log"

cd "$REPO"

{
  echo "Checked at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo
  echo "Timer:"
  systemctl --user list-timers create-artes-ia.timer --no-pager || true
  echo
  echo "Service:"
  systemctl --user status create-artes-ia.service --no-pager || true
  echo
  echo "Unit properties:"
  systemctl --user show create-artes-ia.service -p ActiveState -p SubState -p Result -p ExecMainStatus -p ExecMainCode -p ExecStart -p InvocationID || true
  echo
  echo "Recent journal:"
  journalctl --user -u create-artes-ia.service --no-pager -n 120 || true
  echo
  echo "Latest task log:"
  latest_log="$(ls -1t "$LOG_DIR"/create-artes-ia-*.log 2>/dev/null | head -n 1 || true)"
  if [[ -n "${latest_log:-}" ]]; then
    echo "$latest_log"
    tail -n 120 "$latest_log" || true
  else
    echo "No task log found yet."
  fi
} | tee "$STATUS_LOG"
