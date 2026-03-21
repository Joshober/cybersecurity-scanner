# DVNA benchmark — VibeScan vs eslint-plugin-security vs Bearer vs npm audit

**DVNA source:** [appsecco/dvna](https://github.com/appsecco/dvna) (shallow clone, `main`).  
**VibeScan:** `npm run build` then `node dist/system/cli/index.js scan ./dvna --format json` → [`vibescan-dvna.txt`](./vibescan-dvna.txt).  
**eslint-plugin-security:** v2.1.1 from parent repo, `npx eslint -c results/eslint-dvna.eslintrc.cjs "dvna/**/*.js"` → [`eslint-dvna.txt`](./eslint-dvna.txt) (includes `public/` vendor JS).  
**Bearer:** not run here — see [`bearer-dvna.txt`](./bearer-dvna.txt).  
**npm audit:** `npm install --package-lock-only --ignore-scripts` in `dvna/`, then `npm audit` → [`npm-audit-dvna.txt`](./npm-audit-dvna.txt).

DVNA documents **OWASP Top 10 (2017)**; the table maps each category to **OWASP Top 10 2021** for the poster.

## Coverage vs DVNA’s ten OWASP (2017) themes

| DVNA / OWASP 2017 theme | OWASP 2021 mapping | VibeScan (app-relevant TPs) | eslint-plugin-security (app code, excl. vendor) | Bearer | npm audit |
| ----------------------- | ------------------- | --------------------------- | ----------------------------------------------- | ------ | --------- |
| A1 Injection | A03:2021 Injection | **Yes** — SQLi string-concat + tainted flows (`core/appHandler.js`) | **Partial** — `detect-child-process` on `exec` (related command/exec risk) | TBD | **Indirect** — transitive vulns (e.g. `mysql2`, `sequelize`) |
| A2 Broken Authentication | A07:2021 Identification and Authentication Failures | **Partial** — weak crypto / secrets signals (`server.js` hardcoded secret, `models/index.js` env fallback) | No (on app files scanned) | TBD | **Indirect** — `bcrypt`, cookie/csurf chain |
| A3 Sensitive Data Exposure | A02:2021 Cryptographic Failures | **Partial** — hardcoded secret, env fallback, `Math.random` in deps | No | TBD | **Yes** — multiple crypto-related advisories |
| A4 XML External Entities (XXE) | A05:2021 Security Misconfiguration / injection | No direct XXE rule hit | No | TBD | **Indirect** — `libxmljs` advisories in tree |
| A5 Broken Access Control | A01:2021 Broken Access Control | No dedicated BOLA finding in this run | No | TBD | No |
| A6 Security Misconfiguration | A05:2021 Security Misconfiguration | **Partial** — findings surface misconfig patterns | No | TBD | **Partial** — dependency misconfiguration risk via CVEs |
| A7 XSS | A03:2021 Injection | **Partial** — XSS in bundled `jquery`/`showdown` (not DVNA app source) | Massive noise in `jquery` min (object-injection regexp) | TBD | No |
| A8 Insecure Deserialization | A08:2021 Software and Data Integrity Failures | No hit in this run | No | TBD | **Indirect** — e.g. `serialize-javascript` / transitive issues |
| A9 Using Components with Known Vulnerabilities | A06:2021 Vulnerable Components | **Partial** — static patterns only | No | TBD | **Yes** — many CVEs/GHSAs |
| A10 Insufficient Logging & Monitoring | A09:2021 Security Logging Failures | **Partial** — log injection (`routes/main.js`) | No | TBD | No |

**Legend:** “Yes” = clear true positive aligned with that DVNA theme on first-party code; “Partial” = related signal or only dependency/vendor scope; “TBD” = Bearer output pending; “Indirect” = dependency advisory not tied to a specific line of app code.

## True positive counts (manual, first-party DVNA code only)

Counts below **exclude** `public/assets/*.min.js` and treat each distinct rule × file × line as one finding where applicable.

| DVNA theme (2017) | VibeScan TPs | eslint TPs | Bearer TPs | npm audit TPs |
| ----------------- | ------------ | ---------- | ---------- | ------------- |
| Injection | 3 | 1 | — | — |
| Broken Authentication | 2 | 0 | — | — |
| Sensitive data / crypto | 2 | 0 | — | — |
| XXE | 0 | 0 | — | — |
| Broken Access Control | 0 | 0 | — | — |
| Security Misconfiguration | 0 | 0 | — | — |
| XSS | 0* | 0* | — | — |
| Insecure Deserialization | 0 | 0 | — | — |
| Vulnerable Components | 0 | 0 | — | 1 (aggregate report)** |
| Logging / Monitoring | 1 | 0 | — | — |

\*VibeScan reported XSS / weak randomness in **vendor** bundles only, not in DVNA-authored routes.  
\*\*npm audit is one report covering many CVEs; not split per OWASP row here.

## Preliminary evaluation (for Person B)

This comparison is an **early-stage, qualitative benchmark**: tools differ in scope (static app patterns vs linter heuristics vs dependency advisories), and one commercial/open pipeline (**Bearer**) was not executed in this environment, so the table is incomplete until Bearer output is captured under the same revision of DVNA. **True positives** were judged manually for first-party files only; **eslint** was dominated by vendor JavaScript when the full tree was linted, which inflates raw finding counts without improving DVNA-themed signal. A **full benchmark** suitable for research publication would freeze tool versions, exclude or standardize third-party assets, run Bearer and VibeScan in CI, and add adjudicated labels for every seeded vulnerability in DVNA’s guidebook—left as explicit future work.
