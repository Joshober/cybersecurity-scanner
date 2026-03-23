# Proposed benchmark directory layout

This proposal standardizes **inputs** (vulnerable apps + synthetic seeds), **scripts** (repro runners), and **results** (timestamped raw logs + manifests) under a single `benchmarks/` tree at the repository root. It complements the existing ad hoc [`results/`](../../results/) folder used for DVNA notes and captured tool output.

## Goals

- **Reproducibility:** pin commit, tool versions, and file globs in a manifest per run.
- **Separation of concerns:** never commit huge benchmark clones to the main tree without submodule/git-LFS discipline.
- **Evidence quality:** raw stdout/stderr + structured JSON where available, for adjudication and appendices.

## Directory tree

```text
benchmarks/
├── dvna/                    # DVNA (or fork) — git submodule OR documented clone path
│   └── README.md            # Pin: upstream URL, commit, why this revision
├── seeded/                  # Synthetic / minimal corpora (small files, safe to commit)
│   ├── README.md            # Map folders → rule IDs / CWE families
│   ├── crypto/
│   ├── injection/
│   ├── middleware/
│   └── mixed/               # Multi-rule snippets for integration-style runs
├── scripts/
│   ├── README.md            # Prerequisites (Node, Bearer CLI, etc.)
│   ├── run-all.sh           # POSIX entrypoint (optional)
│   ├── run-all.ps1          # Windows entrypoint (optional)
│   └── lib/                 # Shared helpers (timestamp, manifest merge)
└── results/
    ├── README.md            # Naming convention + retention policy
    └── YYYY-MM-DD_<benchmark>_<tool>/
        ├── manifest.json    # Copy of template, filled for this run
        ├── vibescan.json    # --format json
        ├── vibescan.txt     # optional human log
        ├── eslint.json      # eslint -f json (if used)
        ├── npm-audit.json   # npm audit --json
        ├── bearer.json      # bearer scan --format json (if installed)
        └── notes.md         # Freeform: env, failures, partial runs
```

## `benchmarks/dvna/`

**Purpose:** Real-world-style Node/Express application for end-to-end comparison with other SAST tools.

**Recommended practices:**

- Add **`benchmarks/dvna/README.md`** with:
  - Official repo URL and **exact commit hash** (or submodule pointer).
  - Install steps (`npm ci` vs `npm install`) and Node version.
  - Which paths are **in scope** for static analysis (e.g. exclude `node_modules/`, `test/`, minified vendor).
- Prefer **git submodule** so `git clone --recurse-submodules` reproduces the benchmark; alternatively document `git clone` + `git checkout <hash>` in the manifest’s `notes`.

**Relationship to legacy `results/`:** The repo already contains [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md) and tool captures. When migrating, move or copy artifacts into `benchmarks/results/<run-id>/` and add a `manifest.json` retroactively.

## `benchmarks/seeded/`

**Purpose:** Small, reviewable files that trigger **specific rule IDs** (or deliberate negatives). Use for:

- Per-rule precision/recall when DVNA is too noisy.
- Regression suites when changing formatters or IDs.

**Layout suggestion:**

- One folder per **CWE family** or **rule prefix** (`crypto/`, `injection/`, `middleware/`).
- File naming: `pos-<rule-id-short>.js`, `neg-<rule-id-short>.js` (positives / negatives).
- Include a **`seeded/README.md`** table: path → expected rule IDs (ground truth for automation).

**Seed sources:** Start from [`tests/fixtures/`](../../tests/fixtures/) and inline cases from `tests/unit/*.test.mjs`; deduplicate and document expected findings.

## `benchmarks/results/`

**Purpose:** Immutable (append-only) run outputs for papers and reviewers.

**Naming:** `YYYY-MM-DD_<benchmarkSlug>_<toolOrBundle>_v<semverOrGitShort>/`

Examples:

- `2025-03-20_dvna_vibescan_v1.0.0+abc1234/`
- `2025-03-20_seeded-all_tools-bundle/`

Each folder **must** include a completed **`manifest.json`** (from [`benchmark-manifest-template.json`](./benchmark-manifest-template.json)).

## `benchmarks/scripts/`

**Purpose:** Thin wrappers that:

1. Record versions (`node -v`, `npm ls secure-code-scanner`, global CLIs).
2. Invoke VibeScan, ESLint, `npm audit`, Bearer as in [`reproducible-runs.md`](./reproducible-runs.md).
3. Write outputs under `benchmarks/results/<run-id>/`.

Keep scripts **non-interactive** and suitable for CI (exit codes documented).

## Git ignore considerations

- **Do not** ignore `benchmarks/seeded/` (small files).
- **Do** ignore or submodule `benchmarks/dvna/` if it is a full clone.
- **Optionally** ignore `benchmarks/results/*` except `README.md` if binaries are large; for academic submission, prefer attaching a zip artifact or using a release, and document that policy in `benchmarks/results/README.md`.

## `.gitignore` snippet (optional)

```gitignore
# Large benchmark checkout (if not using submodule)
benchmarks/dvna/dvna/

# Local result dumps (uncomment if you keep results only in releases)
# benchmarks/results/20*/
```

Adjust based on whether the paper requires committed raw outputs.
