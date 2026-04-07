# DVNA benchmark (status snapshot): VibeScan vs eslint-plugin-security vs Snyk Code vs Bearer vs Semgrep vs CodeQL vs npm audit

This file reports a **preliminary, scope-limited** benchmark snapshot. It is not a finalized head-to-head claim across all baselines.

## Poster charts (detection heatmap × case families)

Regenerate HTML from the frozen adjudication matrix:

- Data: `results/dvna-case-catalog.json`, `results/dvna-detection-matrix.json`
- Interpretation (scope, rule packs, fair gaps): [**results/dvna-benchmark-interpretation.md**](./dvna-benchmark-interpretation.md)
- Script: `node benchmarks/scripts/dvna-poster-charts.mjs` (optional `--vibescan-json`, `--fill-codeql`)
- Output: `results/charts/dvna-detection-rate-poster.html` (**heatmap**), `dvna-proof-coverage-poster.html` (VibeScan proof tiers)

See [**docs/vibescan/POSTER-CHARTS.md**](../docs/vibescan/POSTER-CHARTS.md) for usage and scope notes.

CI note:

- Fast regression checks can run from committed artifacts/corpora via `npm run benchmark:validate` plus `node benchmarks/scripts/run-framework-vuln-scan.mjs --out-dir <dir>`.
- Heavier DVNA reruns are better suited to scheduled or manual CI because they require a pinned DVNA checkout and produce larger artifacts/proof outputs.

## Benchmark setup (current state)

- **DVNA source:** [appsecco/dvna](https://github.com/appsecco/dvna) (shallow clone, `main`), frozen at commit `9ba473add536f66ac9007966acb2a775dd31277a`.
- **VibeScan run (current artifact):** `benchmarks/results/2026-04-04_044003_dvna_vibescan_cli/`
  - output JSON: `benchmarks/results/2026-04-04_044003_dvna_vibescan_cli/vibescan-project.json` (CLI **1.1.0**; **25** findings on first-party scope)
  - reproduce: `node benchmarks/scripts/run-dvna-vibescan-scan.mjs` (writes a new timestamped folder) or `npx vibescan scan benchmarks/dvna/dvna --format json --project-root benchmarks/dvna/dvna --exclude-vendor --manifest <run>/manifest.json`
- **VibeScan run (legacy frozen artifact):** `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/` (retained for historical comparison)
  - manifest: `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/manifest.json`
  - output JSON: `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/vibescan-project.json`
- **eslint-plugin-security run:** `npx eslint -c results/eslint-dvna.eslintrc.cjs "dvna/**/*.js"` -> [`eslint-dvna.txt`](./eslint-dvna.txt).
- **Bearer run (frozen artifact):** `benchmarks/results/2026-03-25_223217_dvna_bearer/`
  - manifest (versions + DVNA SHA): `benchmarks/results/2026-03-25_223217_dvna_bearer/manifest.json`
  - output JSON: `benchmarks/results/2026-03-25_223217_dvna_bearer/bearer.json`
- **npm audit:** `npm install --package-lock-only --ignore-scripts` in `dvna/`, then `npm audit` -> [`npm-audit-dvna.txt`](./npm-audit-dvna.txt).
- **Snyk Code run (captured artifact):** `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/snyk-code.json` (36 findings: 4 error, 27 warning, 5 note). Sensitivity notes are under `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/reports/sensitivity.md`. OpenAPI drift / route inventory rules (`API-INV-*`, `routeInventory`) have **no direct Snyk equivalent** in-repo; report separately when claiming that contribution.
- **Semgrep run (frozen artifact):** `benchmarks/results/2026-04-03_dvna_semgrep_1.157.0/`
  - manifest: [`benchmarks/results/2026-04-03_dvna_semgrep_1.157.0/manifest.json`](../benchmarks/results/2026-04-03_dvna_semgrep_1.157.0/manifest.json)
  - JSON + SARIF: `semgrep.json`, `semgrep.sarif`
  - Rules: community packs `p/javascript` + `p/security-audit`; **11** findings on DVNA at the same commit.
  - **Reproduce:** install Semgrep so it is on `PATH` (e.g. Python `Scripts`), set `PYTHONUTF8=1` on Windows for SARIF output, then execute the `command` and `commandSarif` fields from the manifest at the repository root.
- **CodeQL run (frozen artifact):** `benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/`
  - manifest: [`benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/manifest.json`](../benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/manifest.json)
  - SARIF: `codeql.sarif` (javascript-security-and-quality suite via pack `codeql/javascript-queries`)
  - CLI bundle **2.25.1**; query pack **codeql/javascript-queries@2.3.6**; **46** results in SARIF for this run.
  - Full reproduction on Windows: [`benchmarks/scripts/run-codeql-dvna.ps1`](../benchmarks/scripts/run-codeql-dvna.ps1) (one-time CodeQL download under `benchmarks/.cache/`, then `codeql pack download`, database create + analyze).

## Reproducibility checklist

- [x] Record DVNA commit SHA used for this run.
- [x] Record Node and npm versions for the frozen VibeScan run (see run manifest).
- [ ] Run every tool against the same scope policy (first-party-only primary table).
- [x] Execute Bearer and add raw JSON under `benchmarks/results/<run>/` (and link from this doc).
- [x] Add adjudication sheet reference (TP/FP/FN rationale per finding/case).

DVNA documents **OWASP Top 10 (2017)**; mapping below uses OWASP 2021 labels for reporting convenience.

## Frozen versions (from run manifests)

| Component | Frozen value | Source |
|-----------|--------------|--------|
| DVNA commit | `9ba473add536f66ac9007966acb2a775dd31277a` | VibeScan + Bearer `manifest.json` |
| Scanner repo commit (current VibeScan run) | `4112bf3a2ee2aa541ee61024cf258442ca57f478` | `git rev-parse HEAD` at benchmark time |
| Scanner repo commit (legacy VibeScan run) | `aa492475dbbfdc94d620f8976cd8f9c3e98013ce` | `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/manifest.json` |
| Node.js (current VibeScan run) | `v20.17.0` | `benchmarks/results/2026-04-04_044003_dvna_vibescan_cli/vibescan-project.json` embedded manifest |
| Node.js (legacy VibeScan run) | `v22.14.0` | `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/manifest.json` |
| npm (legacy VibeScan run) | `10.9.2` | `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/manifest.json` |
| VibeScan CLI (current run) | `1.1.0` | `benchmarks/results/2026-04-04_044003_dvna_vibescan_cli/vibescan-project.json` embedded manifest |
| VibeScan CLI (legacy run) | `1.0.0` | `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/manifest.json` |
| Bearer image | `bearer/bearer:latest-amd64` | `benchmarks/results/2026-03-25_223217_dvna_bearer/manifest.json` |
| Bearer image digest | `sha256:f6701b1b6385c9e564efe680a8391cacc5e94798d7b719a21450064c26a7b2d9` | `benchmarks/results/2026-03-25_223217_dvna_bearer/manifest.json` |
| Snyk Code CLI | `v1.1303.2` | `snyk --version` (local CLI) |
| Snyk Code run artifact | `36` findings (`error=4`, `warning=27`, `note=5`) | `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/snyk-code.json` |
| Semgrep | `1.157.0` | `benchmarks/results/2026-04-03_dvna_semgrep_1.157.0/manifest.json` |
| CodeQL CLI bundle | `2.25.1` | `benchmarks/scripts/run-codeql-dvna.ps1` + `benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/manifest.json` |
| CodeQL JS query pack | `codeql/javascript-queries@2.3.6` | Pack cache under user `.codeql/packages` (see manifest `queryPack`) |

## Adjudication artifacts (current)

- Canonical DVNA adjudication sheet: [`results/dvna-adjudication.md`](./dvna-adjudication.md)
- VibeScan run artifact: `benchmarks/results/2026-04-04_044003_dvna_vibescan_cli/vibescan-project.json` (summary: 25 findings; includes EJS + expanded injection/crypto rules)
- VibeScan legacy artifact: `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/vibescan-project.json` (summary: 7 findings)
- Bearer run artifact: `benchmarks/results/2026-03-25_223217_dvna_bearer/bearer.json` (summary: 31 findings)
- Snyk Code artifact: `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/snyk-code.json` (captured and adjudicated)
- Semgrep artifact: `benchmarks/results/2026-04-03_dvna_semgrep_1.157.0/semgrep.json` (11 findings; optional line-level adjudication extends [`results/dvna-adjudication.md`](./dvna-adjudication.md))
- CodeQL artifact: `benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/codeql.sarif` (46 results; optional SARIF-level adjudication)

Provisional adjudicated precision from the current sheet:

- VibeScan (legacy adjudication on v1.0.0 artifact): `tp=4`, `fp=1` -> precision `80.0%` (out-of-scope excluded). **Re-do** TP/FP counts against the 1.1.0 artifact for an updated precision figure.
- Bearer: `tp=18`, `fp=2` -> precision `90.0%` (out-of-scope excluded)

Provisional recall (from finalized case-family FN policy in `results/dvna-adjudication.md`):

- VibeScan: `11/11` -> `100%` (case-family line match vs `results/dvna-case-catalog.json` on `benchmarks/results/2026-04-04_044003_dvna_vibescan_cli/vibescan-project.json`; legacy v1.0.0 run was `4/11` -> `36.4%`)
- Bearer: `8/11` -> `72.7%`
- Snyk Code: `7/11` -> `63.6%`
- eslint-plugin-security: `1/11` -> `9.1%`

## Coverage vs DVNA’s ten OWASP (2017) themes (preliminary)

| DVNA / OWASP 2017 theme | OWASP 2021 mapping | VibeScan (app-relevant signal) | eslint-plugin-security (app code, excl. vendor) | Snyk Code | Bearer | npm audit |
| ----------------------- | ------------------- | ------------------------------ | ----------------------------------------------- | --------- | ------ | --------- |
| A1 Injection | A03:2021 Injection | **Yes** — SQLi string-concat + tainted flows (`core/appHandler.js`) | **Partial** — `detect-child-process` on `exec` (related command/exec risk) | adjudicated | adjudicated | **Indirect** — transitive vulns (e.g. `mysql2`, `sequelize`) |
| A2 Broken Authentication | A07:2021 Identification and Authentication Failures | **Partial** — weak crypto / secrets signals (`server.js`, `models/index.js`) | No (on app files scanned) | adjudicated | adjudicated | **Indirect** — `bcrypt`, cookie/csurf chain |
| A3 Sensitive Data Exposure | A02:2021 Cryptographic Failures | **Partial** — hardcoded secret, env fallback, `Math.random` in deps | No | adjudicated | adjudicated | **Yes** — multiple crypto-related advisories |
| A4 XML External Entities (XXE) | A05:2021 Security Misconfiguration / injection | No direct XXE rule hit | No | adjudicated | adjudicated | **Indirect** — `libxmljs` advisories in tree |
| A5 Broken Access Control | A01:2021 Broken Access Control | **Partial** — middleware/auth heuristics on routes (`AUTH-*`, `MW-*`); not proof of BOLA | No | adjudicated | adjudicated | No |
| A6 Security Misconfiguration | A05:2021 Security Misconfiguration | **Partial** — related misconfig signals | No | adjudicated | adjudicated | **Partial** — dependency misconfig risk via CVEs |
| A7 XSS | A03:2021 Injection | **Yes** — DOM XSS in `views/app/adminusers.ejs` (inline script → `innerHTML`) on current VibeScan run | Vendor-noise-prone in minified assets | adjudicated | adjudicated | No |
| A8 Insecure Deserialization | A08:2021 Software and Data Integrity Failures | **Yes** — `node-serialize` `unserialize` on upload data (`core/appHandler.js`) on current VibeScan run | No | adjudicated | adjudicated | **Indirect** — transitive advisories |
| A9 Using Components with Known Vulnerabilities | A06:2021 Vulnerable Components | **Partial** — static pattern layer only | No | adjudicated | adjudicated | **Yes** — many CVEs/GHSAs |
| A10 Insufficient Logging & Monitoring | A09:2021 Security Logging Failures | **Partial** — log injection (`routes/main.js`) | No | adjudicated | adjudicated | No |

**Legend:**  
- **Yes** = clear first-party signal aligned with that DVNA theme.  
- **Partial** = related signal, but not full theme coverage.  
- **Indirect** = dependency advisory scope, not line-level app finding parity.  
- **adjudicated** = raw baseline output exists and has been labeled under `results/dvna-adjudication.md`.

## Manual true-positive counts (first-party DVNA code only, preliminary)

Counts below exclude `public/assets/*.min.js` and count each distinct rule x file x line once where applicable.

| DVNA theme (2017) | VibeScan TPs | eslint TPs | Snyk Code TPs | Bearer TPs | npm audit TPs |
| ----------------- | ------------ | ---------- | ------------- | ---------- | ------------- |
| Injection | 3 | 1 | 6 | adjudicated* | — |
| Broken Authentication | 2 | 0 | 0 | adjudicated* | — |
| Sensitive data / crypto | 2 | 0 | 3 | adjudicated* | — |
| XXE | 0 | 0 | 0 | adjudicated* | — |
| Broken Access Control | 0 | 0 | 0 | adjudicated* | — |
| Security Misconfiguration | 0 | 0 | 0 | adjudicated* | — |
| XSS | 0** | 0** | 3 | adjudicated* | — |
| Insecure Deserialization | 0 | 0 | 1 | adjudicated* | — |
| Vulnerable Components | 0 | 0 | 0 | adjudicated* | 1 (aggregate report)*** |
| Logging / Monitoring | 1 | 0 | 0 | adjudicated* | — |

† **npm audit** column: **—** means no per-theme line-level true-positive count in this table (advisory scope differs from first-party SAST).  
\**VibeScan and eslint showed vendor-file behavior in broader scans; first-party authored DVNA routes did not produce counted XSS TPs in this pass.  
\*Bearer per-finding labels and totals are in `results/dvna-adjudication.md` (Summary table); row-level theme allocation is pending normalization.
\***Single aggregate report with multiple advisories, not one-to-one with OWASP rows.

## Preliminary interpretation (scope-limited)

- Current numbers support only a **preliminary first-party signal comparison** between VibeScan and eslint-plugin-security under this specific setup.
- This file does **not** claim complete baseline parity across all tools and scopes, but major SAST baselines (VibeScan, Bearer, Snyk Code, Semgrep, CodeQL, eslint-plugin-security) are now captured; VibeScan, Bearer, and Snyk Code are adjudicated in depth for this snapshot policy, with Semgrep and CodeQL available as explainability-heavy comparators (frozen SARIF/JSON).
- Because tool scopes differ (static app findings vs dependency advisories), direct cross-tool ranking should be avoided unless scope-normalized metrics are added.

## Remaining work before publication-quality claim

- [x] Capture Snyk Code output on the same DVNA revision/file-scope policy.
- [x] Adjudicate Bearer output against the same ground-truth rubric used for VibeScan/eslint.
- [x] Freeze versions and record them in this file.
- [x] Add explicit TP/FP/FN adjudication artifacts.
- [x] Recompute provisional precision from adjudicated TP/FP sets.
- [x] Adjudicate Snyk Code output against the same rubric.
- [x] Recompute provisional recall after finalizing FN definitions (case-family policy).

Snyk run notes are in `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/reports/sensitivity.md`.
