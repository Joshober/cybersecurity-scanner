# Benchmarking runbook (reproducible runs + folder layout)

This document consolidates:

- the proposed `benchmarks/` directory layout, and
- the step-by-step runbook for reproducible DVNA/seeded executions (VibeScan + baselines).

It is intended to be the canonical reference for **how to run** and **where to store** benchmark artifacts.

## Goals

- **Reproducibility**: pin commits, tool versions, scan scope, and exact commands per run.
- **Comparability**: document scope policy so different tools are run on comparable file sets where feasible.
- **Evidence quality**: keep raw logs + machine-readable JSON for adjudication and appendices.

## Canonical benchmark directory layout

```text
benchmarks/
├── dvna/                    # DVNA checkout strategy + pinned revision notes
│   └── README.md
├── seeded/                  # Synthetic / minimal corpora (safe to commit)
│   ├── README.md
│   ├── crypto/
│   ├── injection/
│   ├── middleware/
│   └── mixed/
├── scripts/                 # Repro runners (bash/PowerShell) + helpers
│   └── README.md
└── results/                 # Append-only run outputs + manifests
    ├── README.md
    └── YYYY-MM-DD_<benchmark>_<tool>_v<versionOrGitShort>/
        ├── manifest.json
        ├── vibescan-project.json
        ├── vibescan-human.txt
        ├── eslint-security.json
        ├── npm-audit.json
        ├── bearer.json
        └── notes.md
```

Notes:

- Prefer DVNA as a submodule or a documented clone+checkout; avoid committing huge clones directly.
- `benchmarks/seeded/` is intended to be committed (small, auditable).
- `benchmarks/results/` is append-only evidence; decide whether to keep large outputs in-repo vs attached artifacts/releases.

## Prerequisites

- **Node.js 18+**
- Dependencies installed at repo root: `npm install`
- **VibeScan built**: `npm run build -w vibescan` (or `npm run build` if defined)
- Optional baselines:
  - **Bearer** CLI available on `PATH`
  - **eslint-plugin-security** config for the target project (DVNA may need a local config)

## Run metadata (minimum required)

For each run, record:

- scanner repo commit SHA
- benchmark repo/dataset revision (DVNA commit, or seeded revision)
- Node/npm versions
- tool versions (VibeScan/eslint/npm audit/Bearer)
- scope policy (included/excluded paths/globs)
- exact command lines

Use the manifest template:

- `docs/vibescan/benchmark-manifest-template.json`

## Build the scanner

POSIX:

```bash
npm install
npm run build -w vibescan
npx vibescan scan vibescan/src --format compact
```

PowerShell:

```powershell
npm install
npm run build -w vibescan
npx vibescan scan vibescan/src --format compact | Select-Object -First 5
```

## Run VibeScan (static)

Pseudocode:

```text
TARGET = benchmarks/dvna/<app-root>   # or benchmarks/seeded/
OUT    = benchmarks/results/<run-id>/

npx vibescan scan TARGET --format json --project-root TARGET > OUT/vibescan-project.json
npx vibescan scan TARGET --format human               > OUT/vibescan-human.txt

# Optional registry signal:
npx vibescan scan TARGET --check-registry --project-root TARGET --format json > OUT/vibescan-with-registry.json
```

## Run eslint-plugin-security (baseline)

DVNA may not ship ESLint security rules; reuse/adapt `results/eslint-dvna.eslintrc.cjs` if needed.

```bash
cd "$TARGET"
npx eslint . --ext .js,.cjs,.mjs -f json -o "$OLDPWD/$OUT/eslint-security.json" || true
```

## Run npm audit (baseline)

```bash
cd "$TARGET"
npm audit --json > "$OLDPWD/$OUT/npm-audit.json" || true
```

Important: `npm audit` is dependency advisory scope; do not directly mix it into line-level TP/FP/FN without an explicit mapping protocol.

## Run Bearer (optional baseline)

```bash
cd "$TARGET"
bearer scan . --format json --output-path "$OLDPWD/$OUT/bearer.json"
```

If Bearer is unavailable, record the skip explicitly in the run notes/manifest.

## Finalize the run output folder

1. Copy `docs/vibescan/benchmark-manifest-template.json` to `OUT/manifest.json`
2. Fill the required fields (commits, versions, scope policy, commands, notes)
3. Keep `notes.md` for environment quirks (offline registry, ESLint parse failures, etc.)

## Integrity checklist (for reviewers)

- Manifest references the exact benchmark revision.
- Scanner build matches the documented repo commit.
- Outputs are untouched after run (optional: hash artifacts).

