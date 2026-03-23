# DVNA benchmark — VibeScan vs eslint-plugin-security vs Snyk Code vs Bearer vs npm audit

This file reports a **preliminary and incomplete** benchmark pass. It must not be interpreted as a finalized head-to-head study across all baselines.

## Benchmark setup (current state)

- **DVNA source:** [appsecco/dvna](https://github.com/appsecco/dvna) (shallow clone, `main`).
- **VibeScan run:** `npm run build -w vibescan` then `node vibescan/dist/system/cli/index.js scan ./dvna --format json --exclude-vendor --benchmark-metadata` (or `.\benchmarks\scripts\run-vibescan-dvna.ps1` / `./benchmarks/scripts/run-vibescan-dvna.sh` when DVNA is present) -> [`vibescan-dvna.txt`](./vibescan-dvna.txt).
- **eslint-plugin-security run:** `npx eslint -c results/eslint-dvna.eslintrc.cjs "dvna/**/*.js"` -> [`eslint-dvna.txt`](./eslint-dvna.txt).
- **Bearer:** **not run in this environment**; see [`bearer-dvna.txt`](./bearer-dvna.txt) and [`../benchmarks/scripts/README.md`](../benchmarks/scripts/README.md) for Docker/scripts when the daemon is available.
- **npm audit:** `npm install --package-lock-only --ignore-scripts` in `dvna/`, then `npm audit` -> [`npm-audit-dvna.txt`](./npm-audit-dvna.txt).
- **Snyk Code:** **not run in this environment**; recommended baseline command (after `snyk auth`): `snyk code test ./dvna --json-file-output=results/snyk-code-dvna.json` — scope-aligned SAST for comparison with VibeScan’s first-party JS findings. OpenAPI drift / route inventory rules (`API-INV-*`, `routeInventory`) have **no direct Snyk equivalent** in-repo; document separately when claiming that contribution.

## Reproducibility TODOs (required before final paper numbers)

- [ ] Record DVNA commit SHA used for this run.
- [ ] Record Node, npm, eslint, eslint-plugin-security, and Bearer versions in this file.
- [ ] Re-run all tools under the same scope policy (first-party-only primary table).
- [ ] Execute Bearer and add raw JSON under `benchmarks/results/<run>/` (and link from this doc).
- [ ] Add adjudication sheet reference (TP/FP/FN rationale per finding/case).

DVNA documents **OWASP Top 10 (2017)**; mapping below uses OWASP 2021 labels for reporting convenience.

## Coverage vs DVNA’s ten OWASP (2017) themes (preliminary)

| DVNA / OWASP 2017 theme | OWASP 2021 mapping | VibeScan (app-relevant signal) | eslint-plugin-security (app code, excl. vendor) | Snyk Code | Bearer | npm audit |
| ----------------------- | ------------------- | ------------------------------ | ----------------------------------------------- | --------- | ------ | --------- |
| A1 Injection | A03:2021 Injection | **Yes** — SQLi string-concat + tainted flows (`core/appHandler.js`) | **Partial** — `detect-child-process` on `exec` (related command/exec risk) | TODO (not run) | TODO (not run) | **Indirect** — transitive vulns (e.g. `mysql2`, `sequelize`) |
| A2 Broken Authentication | A07:2021 Identification and Authentication Failures | **Partial** — weak crypto / secrets signals (`server.js`, `models/index.js`) | No (on app files scanned) | TODO (not run) | TODO (not run) | **Indirect** — `bcrypt`, cookie/csurf chain |
| A3 Sensitive Data Exposure | A02:2021 Cryptographic Failures | **Partial** — hardcoded secret, env fallback, `Math.random` in deps | No | TODO (not run) | TODO (not run) | **Yes** — multiple crypto-related advisories |
| A4 XML External Entities (XXE) | A05:2021 Security Misconfiguration / injection | No direct XXE rule hit | No | TODO (not run) | TODO (not run) | **Indirect** — `libxmljs` advisories in tree |
| A5 Broken Access Control | A01:2021 Broken Access Control | **Partial** — middleware/auth heuristics on routes (`AUTH-*`, `MW-*`); not proof of BOLA | No | TODO (not run) | TODO (not run) | No |
| A6 Security Misconfiguration | A05:2021 Security Misconfiguration | **Partial** — related misconfig signals | No | TODO (not run) | TODO (not run) | **Partial** — dependency misconfig risk via CVEs |
| A7 XSS | A03:2021 Injection | **Partial** — signal in bundled vendor files (not DVNA app source) | Vendor-noise-prone in minified assets | TODO (not run) | TODO (not run) | No |
| A8 Insecure Deserialization | A08:2021 Software and Data Integrity Failures | No hit in this run | No | TODO (not run) | TODO (not run) | **Indirect** — transitive advisories |
| A9 Using Components with Known Vulnerabilities | A06:2021 Vulnerable Components | **Partial** — static pattern layer only | No | TODO (not run) | TODO (not run) | **Yes** — many CVEs/GHSAs |
| A10 Insufficient Logging & Monitoring | A09:2021 Security Logging Failures | **Partial** — log injection (`routes/main.js`) | No | TODO (not run) | TODO (not run) | No |

**Legend:**  
- **Yes** = clear first-party signal aligned with that DVNA theme.  
- **Partial** = related signal, but not full theme coverage.  
- **Indirect** = dependency advisory scope, not line-level app finding parity.  
- **TODO (not run)** = missing baseline data.

## Manual true-positive counts (first-party DVNA code only, preliminary)

Counts below exclude `public/assets/*.min.js` and count each distinct rule x file x line once where applicable.

| DVNA theme (2017) | VibeScan TPs | eslint TPs | Snyk Code TPs | Bearer TPs | npm audit TPs |
| ----------------- | ------------ | ---------- | ------------- | ---------- | ------------- |
| Injection | 3 | 1 | TODO | TODO | TODO* |
| Broken Authentication | 2 | 0 | TODO | TODO | TODO* |
| Sensitive data / crypto | 2 | 0 | TODO | TODO | TODO* |
| XXE | 0 | 0 | TODO | TODO | TODO* |
| Broken Access Control | 0 | 0 | TODO | TODO | TODO* |
| Security Misconfiguration | 0 | 0 | TODO | TODO | TODO* |
| XSS | 0** | 0** | TODO | TODO | TODO* |
| Insecure Deserialization | 0 | 0 | TODO | TODO | TODO* |
| Vulnerable Components | 0 | 0 | TODO | TODO | 1 (aggregate report)*** |
| Logging / Monitoring | 1 | 0 | TODO | TODO | TODO* |

\*`npm audit` does not map cleanly to first-party line-level TP counting without an explicit mapping protocol.  
\**VibeScan and eslint showed vendor-file behavior in broader scans; first-party authored DVNA routes did not produce counted XSS TPs in this pass.  
\***Single aggregate report with multiple advisories, not one-to-one with OWASP rows.

## Preliminary interpretation (scope-limited)

- Current numbers support only a **preliminary first-party signal comparison** between VibeScan and eslint-plugin-security under this specific setup.
- This file does **not** claim complete baseline parity because Bearer is pending.
- Because tool scopes differ (static app findings vs dependency advisories), direct cross-tool ranking should be avoided unless scope-normalized metrics are added.

## Remaining work before publication-quality claim

- [ ] Run Snyk Code and Bearer on the same DVNA revision and file-scope policy.
- [ ] Freeze versions and record them in this file.
- [ ] Add explicit TP/FP/FN adjudication artifacts.
- [ ] Recompute precision/recall once FN definitions are finalized for the benchmark.
