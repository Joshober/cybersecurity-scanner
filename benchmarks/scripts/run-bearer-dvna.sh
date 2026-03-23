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
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon not running. See results/bearer-dvna.txt" >&2
  exit 1
fi
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
OUT="$REPO_ROOT/benchmarks/results/${STAMP}_dvna_bearer"
mkdir -p "$OUT"
docker run --rm -v "$DVNA:/scan" bearer/bearer:latest-amd64 scan /scan --format json > "$OUT/bearer.json"
echo "Wrote $OUT/bearer.json"
