# Second benchmark corpus (protocol)

This document selects a **second controlled vulnerable application** to pair with DVNA (`benchmarks/dvna/dvna`) for comparative studies (VibeScan vs Semgrep, CodeQL, Snyk, Bearer, eslint, npm audit), as outlined in the comparative research plan.

## Recommended corpus: OWASP NodeGoat

**Repository:** [OWASP/NodeGoat](https://github.com/OWASP/NodeGoat)  
**Rationale:** Express/MongoDB training app, actively maintained, OWASP-aligned lessons, comparable stack to many Node/JS CI scenarios. It is larger than DVNA; treat scope (first-party `app` source vs `node_modules`) explicitly in manifests.

### Setup

1. Clone a **fixed revision** (record full commit SHA in the run manifest):
   ```bash
   git clone https://github.com/OWASP/NodeGoat.git benchmarks/nodegoat/NodeGoat
   cd benchmarks/nodegoat/NodeGoat
   git checkout <pinned-sha>
   ```
2. Add `benchmarks/nodegoat/NodeGoat/` to `.gitignore` (same pattern as DVNA) if you do not vendor the clone in git.
3. Install dependencies only if a tool requires it for analysis; record `npm --version` / `node --version` in the manifest.

### Frozen multi-tool protocol (mirror DVNA)

For each tool, create `benchmarks/results/<UTC-timestamp>_<corpus>_<tool>_<version>/` containing:

| Artifact | Semgrep | CodeQL | VibeScan | Bearer | Snyk | eslint | npm audit |
|----------|---------|--------|----------|--------|------|--------|-----------|
| Raw output | `semgrep.json`, `semgrep.sarif` | `codeql.sarif`, `codeql-db/` | `vibescan-project.json` | `bearer.json` | `snyk-code.json` | console or SARIF | `npm audit` text |
| Manifest | `manifest.json` | `manifest.json` | `--manifest` | same | same | command + config path | lockfile hash |

**Commands (examples — adjust paths):**

- **VibeScan:**  
  `npx vibescan scan benchmarks/nodegoat/NodeGoat --format json --project-root benchmarks/nodegoat/NodeGoat --exclude-vendor --benchmark-metadata --manifest <run>/manifest.json`
- **Semgrep:**  
  `semgrep scan --config p/javascript --config p/security-audit benchmarks/nodegoat/NodeGoat --json --output <run>/semgrep.json`  
  (Windows: set `PYTHONUTF8=1` for SARIF.)
- **CodeQL:**  
  Reuse [`benchmarks/scripts/run-codeql-dvna.ps1`](../benchmarks/scripts/run-codeql-dvna.ps1) pattern: parameterize `source-root` to `benchmarks/nodegoat/NodeGoat` or copy the script to `run-codeql-nodegoat.ps1`.
- **Bearer / Snyk / eslint / npm audit:**  
  Same structure as [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md).

### Adjudication

Add a sibling adjudication file (e.g. `results/nodegoat-adjudication.md`) or a new section in the DVNA sheet if you keep one rubric. Use the same labels: `tp`, `fp`, `fn`, `out_of_scope`.

### Reporting

When publishing, cite **both** corpora: DVNA + NodeGoat (or alternative below), with **separate** precision/recall tables unless you normalize ground-truth across apps.

## Alternative corpora (shorter list)

| Project | Notes |
|---------|--------|
| [cr0hn/vulnerable-node](https://github.com/cr0hn/vulnerable-node) | Smaller Express app; good for quick pilots. |
| [Appsecco DVNA](https://github.com/appsecco/dvna) | Already primary benchmark in this repo. |

## Status

- [ ] Clone NodeGoat at pinned SHA and record in `PROJECT-OVERVIEW.md` / evaluation doc.
- [ ] Run frozen tool matrix and store under `benchmarks/results/`.
- [ ] Write `results/nodegoat-evaluation.md` (or extend `dvna-evaluation.md` with a part II).
