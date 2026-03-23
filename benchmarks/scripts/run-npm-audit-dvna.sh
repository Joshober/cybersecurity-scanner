#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DVNA_DEFAULT="$REPO_ROOT/benchmarks/dvna/dvna"
DVNA_LEGACY="$REPO_ROOT/dvna"
if [[ -n "${DVNA_ROOT:-}" ]]; then
  DVNA="$DVNA_ROOT"
elif [[ -d "$DVNA_DEFAULT" ]]; then
  DVNA="$DVNA_DEFAULT"
else
  DVNA="$DVNA_LEGACY"
fi
if [[ ! -d "$DVNA" ]]; then
  echo "DVNA not found at $DVNA." >&2
  exit 1
fi
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
OUT="$REPO_ROOT/benchmarks/results/${STAMP}_dvna_npm_audit"
mkdir -p "$OUT"
cd "$DVNA"
npm install --package-lock-only --ignore-scripts >/dev/null
npm audit --json > "$OUT/npm-audit.json" || true
echo "Wrote $OUT/npm-audit.json"
