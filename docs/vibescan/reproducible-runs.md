# Reproducible benchmark runs (VibeScan + baselines)

This document describes **scripts and pseudocode** for repeatable evaluation. Paths assume the **monorepo root** (`CyberSecurity/`). Adapt drive letters on Windows.

## Prerequisites

- **Node.js 18+** (`node -v`)
- Dependencies installed: `npm install` at repo root
- **VibeScan** built: `npm run build:scanner` (or `npm run build` if defined at root)
- Optional: **Bearer** CLI on `PATH` (`bearer version`)
- Optional: **eslint-plugin-security** configured for the target project (DVNA may need a local `.eslintrc.cjs`)

---

## 1. Record run metadata (pseudocode)

```text
RUN_ID = ISO_DATE + "_" + BENCHMARK_SLUG + "_" + short_git_hash(repo)
OUT    = benchmarks/results/${RUN_ID}/
mkdir -p OUT

# Versions file (append to manifest.notes or versions.txt)
node -v > OUT/node-version.txt
npm -v >> OUT/node-version.txt
git rev-parse HEAD > OUT/scanner-repo-commit.txt

# Package version of the scanner workspace
npm ls secure-code-scanner --json > OUT/npm-ls-secure-code-scanner.json

# Optional global tools
( bearer version || echo "bearer not installed" ) > OUT/bearer-version.txt
```

---

## 2. Build the scanner

**Shell (POSIX):**

```bash
cd /path/to/CyberSecurity
npm install
npm run build:scanner
# Verify binary resolves:
npx vibescan scan packages/secure-code-scanner/src --format compact | head -n 5
```

**PowerShell:**

```powershell
Set-Location C:\path\to\CyberSecurity
npm install
npm run build:scanner
npx vibescan scan packages/secure-code-scanner/src --format compact | Select-Object -First 5
```

---

## 3. Run VibeScan (static, JSON + text)

**Target:** DVNA root or `benchmarks/seeded/mixed/`.

Pseudocode:

```text
TARGET = benchmarks/dvna/<app-root>   # or seeded folder

npx vibescan scan "$TARGET" \
  --format json \
  --project-root "$TARGET" \
  > OUT/vibescan-project.json

# Human-readable archive (optional)
npx vibescan scan "$TARGET" \
  --format human \
  > OUT/vibescan-human.txt

# Registry signal (network; document offline failures in manifest.notes)
npx vibescan scan "$TARGET" \
  --check-registry \
  --project-root "$TARGET" \
  --format json \
  > OUT/vibescan-with-registry.json
```

**Windows note:** If `vibescan` expands globs differently, pass an explicit directory; the CLI uses `fast-glob` for directories ([`packages/secure-code-scanner/src/system/cli/index.ts`](../../packages/secure-code-scanner/src/system/cli/index.ts)).

---

## 4. Run eslint-plugin-security

DVNA may not ship ESLint security rules; reuse or adapt [`results/eslint-dvna.eslintrc.cjs`](../../results/eslint-dvna.eslintrc.cjs).

```bash
cd "$TARGET"
# Example: flat config or legacy eslintrc as appropriate
npx eslint . \
  --ext .js,.cjs,.mjs \
  -f json \
  -o "$OLDPWD/OUT/eslint-security.json" \
  || true    # capture non-zero; many projects fail lint with warnings-as-errors
```

Copy the **ESLint version** and **eslint-plugin-security** version into the manifest `toolVersions`.

---

## 5. Run npm audit

Run from the benchmark app directory (where `package.json` / lockfile live):

```bash
cd "$TARGET"
npm audit --json > "$OLDPWD/OUT/npm-audit.json" || true
```

`npm audit` reports **supply-chain / known CVEs**, not the same class as VibeScan’s static rules — useful as a **complementary baseline** in the paper.

---

## 6. Run Bearer (optional)

```bash
cd "$TARGET"
if command -v bearer >/dev/null 2>&1; then
  bearer scan . --format json --output-path "$OLDPWD/OUT/bearer.json"
else
  echo "Bearer not installed; skipped" > "$OLDPWD/OUT/bearer-skipped.txt"
fi
```

---

## 7. Finalize manifest

1. Copy [`benchmark-manifest-template.json`](./benchmark-manifest-template.json) to `OUT/manifest.json`.
2. Fill `benchmarkName`, `sourceRepo`, `commitHash`, `toolVersions`, `includedFiles` / `excludedFiles`, `runDate`, `notes`.
3. Attach `notes` for: network required (`--check-registry`), ESLint/Bearer failures, and Node version pins.

---

## One-shot runner sketch (bash)

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
BENCH="${1:?benchmark root dir}"
SLUG="${2:?slug e.g. dvna}"
RUN_ID="$(date -u +%Y-%m-%d)_${SLUG}_$(git -C "$ROOT" rev-parse --short HEAD)"
OUT="$ROOT/benchmarks/results/$RUN_ID"
mkdir -p "$OUT"

( cd "$ROOT" && npm run build:scanner )

npx --prefix "$ROOT" vibescan scan "$BENCH" --format json --project-root "$BENCH" > "$OUT/vibescan-project.json"

# ... call eslint, npm audit, bearer similarly ...

cp "$ROOT/docs/vibescan/benchmark-manifest-template.json" "$OUT/manifest.json"
echo "Edit $OUT/manifest.json with metadata."
```

---

## Integrity checklist (for reviewers)

- [ ] `manifest.json` commit hash matches DVNA (or seeded corpus) revision.
- [ ] Scanner build is from documented commit (`scanner-repo-commit.txt`).
- [ ] Outputs are **untouched** after run (hash optional: `sha256sum OUT/*`).
- [ ] `notes` explain skipped tools (Bearer missing, offline registry, ESLint parse errors).
