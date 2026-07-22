#!/usr/bin/env bash
set -euo pipefail

REPO="/home/ubuntu/projects/hail-mary"
PROMPT="$REPO/.Codex/scheduled/create-artes-ia-prompt.md"
LOG="$REPO/.Codex/scheduled/create-artes-ia-$(date -u +%Y%m%dT%H%M%SZ).log"
LOCK="$REPO/.Codex/scheduled/create-artes-ia.lock"
CLAUDE_BIN="/home/ubuntu/.local/bin/claude"

cd "$REPO"

{
  echo "Started at $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "Repo: $REPO"
  echo "Prompt: $PROMPT"
  echo
} >> "$LOG"

exec flock -n "$LOCK" "$CLAUDE_BIN" \
  --print \
  --effort medium \
  --dangerously-skip-permissions \
  --permission-mode bypassPermissions \
  --name "create-artes-ia-scheduled" \
  "$(cat "$PROMPT")" >> "$LOG" 2>&1
