#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LAB="$REPO_ROOT/benchmarks/vuln-lab"
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
OUT="$REPO_ROOT/benchmarks/results/${STAMP}_vuln_lab_baselines"
mkdir -p "$OUT"

echo "Installing VulnLab deps..."
(cd "$LAB" && npm ci)

echo "Building VibeScan..."
(cd "$REPO_ROOT" && npm run build -w vibescan)

echo "VibeScan JSON + adjudication + manifest..."
node "$REPO_ROOT/vibescan/dist/system/cli/index.js" scan "$LAB" \
  --format json --exclude-vendor --benchmark-metadata \
  --manifest "$OUT/manifest.json" \
  --export-adjudication "$OUT/vibescan-adjudication" \
  > "$OUT/vibescan-project.json"

echo "ESLint (json)..."
(cd "$REPO_ROOT" && npx eslint -f json -c "$LAB/.eslintrc.cjs" "$LAB/server.js" > "$OUT/eslint.json") || true

echo "npm audit..."
(cd "$LAB" && npm audit --json > "$OUT/npm-audit.json") || true

echo "Done. Output: $OUT"
ls -la "$OUT"
