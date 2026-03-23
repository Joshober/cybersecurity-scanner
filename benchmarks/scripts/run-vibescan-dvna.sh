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
  echo "DVNA not found at $DVNA. Clone per benchmarks/dvna/README.md or set DVNA_ROOT." >&2
  exit 1
fi
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
OUT="$REPO_ROOT/benchmarks/results/${STAMP}_dvna_vibescan"
mkdir -p "$OUT"
cd "$REPO_ROOT"
npm run build -w vibescan
node vibescan/dist/system/cli/index.js scan "$DVNA" --format json --exclude-vendor --benchmark-metadata > "$OUT/vibescan.json"
echo "Wrote $OUT/vibescan.json"
