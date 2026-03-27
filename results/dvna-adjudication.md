# DVNA adjudication sheet (cross-tool)

This file is the canonical TP/FP/FN adjudication artifact for the DVNA benchmark snapshot.

## Scope and rubric

- Scope: first-party DVNA code under `benchmarks/dvna/dvna` (exclude vendor/minified assets unless explicitly noted).
- Label set: `tp`, `fp`, `fn`, `out_of_scope`.
- Unit of adjudication: distinct `rule x file x line` finding (or nearest stable fingerprint when line drift occurs).

## Inputs

- VibeScan: `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/vibescan-project.json`
- Bearer: `benchmarks/results/2026-03-25_223217_dvna_bearer/bearer.json`
- Snyk Code baseline: `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/snyk-code.json` (captured and adjudicated)
- Legacy baselines:
  - `results/eslint-dvna.txt`
  - `results/npm-audit-dvna.txt`

## Current status

| Tool | Raw findings captured | Adjudication status |
|------|------------------------|---------------------|
| VibeScan | 7 | adjudicated in this sheet |
| Bearer | 31 | adjudicated in this sheet |
| Snyk Code | 36 | adjudicated in this sheet |
| eslint-plugin-security | text output captured | partial (theme-level TP counts in `results/dvna-evaluation.md`) |
| npm audit | text output captured | out-of-scope for direct line-level TP/FP/FN |

## Per-finding adjudication log (append rows)

| tool | file | line | rule | label | rationale | reviewer |
|------|------|------|------|-------|-----------|----------|
| vibescan | `core/appHandler.js` | 11 | `injection.sql.tainted-flow` | `tp` | query includes untrusted input in SQL path and matches DVNA injection intent | |
| vibescan | `core/appHandler.js` | 39 | `injection.sql.string-concat` | `tp` | direct concatenation into execution sink in attacker-controlled flow | |
| vibescan | `core/appHandler.js` | 39 | `injection.sql.tainted-flow` | `out_of_scope` | duplicate overlap with same-location SQL concat record; excluded from unique-count scoring | |
| vibescan | `models/index.js` | 6 | `SEC-004` | `tp` | hard default secret fallback is present and security-relevant | |
| vibescan | `models/index.js` | 37 | `injection.path-traversal` | `fp` | filename source is directory listing under `__dirname`, not user-controlled path input | |
| vibescan | `routes/main.js` | 24 | `injection.log` | `out_of_scope` | low-severity logging hygiene signal excluded from primary DVNA vulnerability scoring | |
| vibescan | `server.js` | 24 | `crypto.secrets.hardcoded` | `tp` | static session secret literal is present in app configuration | |
| bearer | `core/appHandler.js` | 11 | `javascript_lang_sql_injection` | `tp` | explicit SQL injection pattern in vulnerable app path | |
| bearer | `core/appHandler.js` | 39 | `javascript_lang_os_command_injection` | `tp` | command execution uses unsanitized request-derived input | |
| bearer | `core/appHandler.js` | 59 | `javascript_express_nosql_injection` | `tp` | query filter incorporates request-influenced fields without validation | |
| bearer | `core/appHandler.js` | 85 | `javascript_express_nosql_injection` | `tp` | request query value directly reaches DB predicate | |
| bearer | `core/appHandler.js` | 107 | `javascript_express_nosql_injection` | `tp` | request body value directly reaches DB predicate | |
| bearer | `core/appHandler.js` | 145 | `javascript_express_nosql_injection` | `tp` | request body value used in user lookup predicate | |
| bearer | `core/appHandler.js` | 188 | `javascript_express_open_redirect` | `tp` | user-controlled redirect target is used without allowlist | |
| bearer | `core/appHandler.js` | 235 | `javascript_express_xml_external_entity_vulnerability` | `tp` | XML parser invoked with external entities enabled on uploaded input | |
| bearer | `core/authHandler.js` | 21 | `javascript_express_nosql_injection` | `tp` | login lookup predicate accepts unsanitized request body field | |
| bearer | `core/authHandler.js` | 43 | `javascript_express_nosql_injection` | `tp` | login lookup predicate accepts unsanitized request query field | |
| bearer | `core/authHandler.js` | 49 | `javascript_lang_observable_timing` | `out_of_scope` | side-channel hardening signal excluded from primary injection/crypto comparison scope | |
| bearer | `core/authHandler.js` | 49 | `javascript_lang_weak_hash_md5` | `tp` | weak hash usage in auth token workflow is present | |
| bearer | `core/authHandler.js` | 72 | `javascript_express_nosql_injection` | `tp` | request body login value flows into DB lookup predicate | |
| bearer | `core/authHandler.js` | 78 | `javascript_lang_observable_timing` | `out_of_scope` | side-channel hardening signal excluded from primary comparison scope | |
| bearer | `core/authHandler.js` | 78 | `javascript_lang_weak_hash_md5` | `tp` | repeated weak hash usage in auth flow | |
| bearer | `core/passport.js` | 13 | `javascript_express_nosql_injection` | `tp` | user identifier flows into DB query predicate | |
| bearer | `core/passport.js` | 31 | `javascript_express_nosql_injection` | `tp` | username credential path reaches DB lookup without normalization/sanitization | |
| bearer | `core/passport.js` | 55 | `javascript_express_nosql_injection` | `tp` | email/username auth path reaches DB query directly | |
| bearer | `core/passport.js` | 65 | `javascript_express_nosql_injection` | `tp` | user-supplied registration fields written directly to DB model create path | |
| bearer | `models/index.js` | 24 | `javascript_lang_logger_leak` | `out_of_scope` | low-severity log hygiene finding excluded from primary scoring scope | |
| bearer | `models/index.js` | 32 | `javascript_lang_logger_leak` | `out_of_scope` | low-severity log hygiene finding excluded from primary scoring scope | |
| bearer | `models/index.js` | 37 | `javascript_lang_non_literal_fs_filename` | `fp` | dynamic filename is enumerated from local directory, not attacker input | |
| bearer | `models/index.js` | 43 | `javascript_lang_path_traversal` | `fp` | `path.join(__dirname, file)` uses local module filenames, not user-controlled path | |
| bearer | `routes/main.js` | 24 | `javascript_lang_logger_leak` | `out_of_scope` | logging/error disclosure class excluded from primary scoring scope | |
| bearer | `server.js` | 11 | `javascript_express_helmet_missing` | `out_of_scope` | baseline hardening recommendation; not used in primary DVNA vulnerability parity table | |
| bearer | `server.js` | 11 | `javascript_express_reduce_fingerprint` | `out_of_scope` | defense-in-depth hardening signal excluded from primary scoring | |
| bearer | `server.js` | 23 | `javascript_express_default_session_config` | `out_of_scope` | configuration hardening signal excluded from primary DVNA parity scoring | |
| bearer | `server.js` | 23 | `javascript_express_hardcoded_secret` | `tp` | hardcoded session secret present in server config | |
| bearer | `server.js` | 23 | `javascript_express_insecure_cookie` | `out_of_scope` | cookie hardening finding excluded from primary scope | |
| bearer | `server.js` | 24 | `javascript_lang_hardcoded_secret` | `out_of_scope` | duplicate hardcoded-secret signal on same session literal (counted once) | |
| bearer | `server.js` | 27 | `javascript_express_default_cookie_config` | `out_of_scope` | cookie default-hardening recommendation excluded from primary scoring | |
| snyk | `core/appHandler.js` | 11 | `javascript/Sqli` | `tp` | request-body input reaches SQL query sink in DVNA vulnerable flow | |
| snyk | `core/appHandler.js` | 38 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/appHandler.js` | 39 | `javascript/CommandInjection` | `tp` | command built with unsanitized request-derived input | |
| snyk | `core/appHandler.js` | 76 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/appHandler.js` | 136 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/appHandler.js` | 150 | `javascript/HTTPSourceWithUncheckedType` | `out_of_scope` | typedness/note-level defensive signal, not counted in primary exploit-oriented table | |
| snyk | `core/appHandler.js` | 151 | `javascript/HTTPSourceWithUncheckedType` | `out_of_scope` | typedness/note-level defensive signal, not counted in primary exploit-oriented table | |
| snyk | `core/appHandler.js` | 188 | `javascript/OR` | `tp` | user-controlled redirect target without allowlist is present | |
| snyk | `core/appHandler.js` | 194 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/appHandler.js` | 215 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/appHandler.js` | 218 | `javascript/Deserialization` | `tp` | untrusted upload content reaches deserialize sink | |
| snyk | `core/appHandler.js` | 233 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/authHandler.js` | 49 | `javascript/InsecureHash` | `tp` | MD5 usage in auth/token path is present | |
| snyk | `core/authHandler.js` | 69 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `core/authHandler.js` | 78 | `javascript/InsecureHash` | `tp` | repeated MD5 usage in auth/token path | |
| snyk | `models/index.js` | 12 | `javascript/ServerLeak` | `out_of_scope` | logging/telemetry hardening finding excluded from primary parity scope | |
| snyk | `routes/app.js` | 10 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/app.js` | 16 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/app.js` | 22 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/app.js` | 32 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/app.js` | 36 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/app.js` | 44 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/main.js` | 10 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/main.js` | 14 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/main.js` | 32 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/main.js` | 36 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/main.js` | 45 | `javascript/NoRateLimitingForExpensiveWebOperation` | `out_of_scope` | operational rate-limit hardening signal excluded from primary vuln parity scoring | |
| snyk | `routes/main.js` | 51 | `javascript/NoRateLimitingForLogin` | `out_of_scope` | auth-throttling hardening finding excluded from primary vuln parity scope | |
| snyk | `routes/main.js` | 57 | `javascript/NoRateLimitingForLogin` | `out_of_scope` | auth-throttling hardening finding excluded from primary vuln parity scope | |
| snyk | `server.js` | 11 | `javascript/DisablePoweredBy` | `out_of_scope` | framework fingerprint hardening recommendation excluded from primary scope | |
| snyk | `server.js` | 11 | `javascript/UseCsurfForExpress` | `out_of_scope` | framework-wide CSRF middleware recommendation treated as posture hardening in this benchmark | |
| snyk | `server.js` | 23 | `javascript/HardcodedNonCryptoSecret` | `tp` | hardcoded session secret present in server config | |
| snyk | `server.js` | 27 | `javascript/WebCookieSecureDisabledExplicitly` | `out_of_scope` | cookie-hardening recommendation excluded from primary exploit parity scoring | |
| snyk | `views/app/adminusers.ejs` | 40 | `javascript/DOMXSS` | `tp` | dynamic client-side HTML injection sink with untrusted data path | |
| snyk | `views/app/adminusers.ejs` | 41 | `javascript/DOMXSS` | `tp` | dynamic client-side HTML injection sink with untrusted data path | |
| snyk | `views/app/adminusers.ejs` | 42 | `javascript/DOMXSS` | `tp` | dynamic client-side HTML injection sink with untrusted data path | |

## Summary

| Tool | TP | FP | FN | Out of scope | Notes |
|------|---:|---:|---:|-------------:|-------|
| VibeScan | 4 | 1 | 0 | 2 | One duplicate SQL-flow finding and one logging-hygiene finding excluded from primary scoring. |
| Bearer | 18 | 2 | 0 | 11 | Strong DVNA vuln coverage; includes several hardening/duplicate signals excluded from primary scope. |
| Snyk Code | 10 | 0 | 0 | 26 | Captured and adjudicated; most non-TPs are rate-limit/posture hardening findings scoped out of primary parity metrics. |
| eslint-plugin-security | 1 | 0 | 0 | 0 | Preliminary count from legacy text output; full per-finding sheet not yet expanded here. |

## FN definition policy (finalized for this snapshot)

To avoid inflating/deflating recall with duplicate line-level findings, FN is computed on a **deduplicated case-family catalog** rather than raw finding count.

- Case key = `vulnerability family x subsystem/file cluster`
- Duplicate reports in the same case key count once
- Posture/hardening-only findings (`NoRateLimiting*`, `DisablePoweredBy`, cookie defaults, generic logging leakage) remain `out_of_scope`

### Canonical in-scope DVNA case-family catalog (11 cases)

1. SQL injection (`core/appHandler.js`)
2. Command injection (`core/appHandler.js`)
3. Open redirect (`core/appHandler.js`)
4. Insecure deserialization (`core/appHandler.js`)
5. NoSQL injection (`core/appHandler.js`)
6. NoSQL injection (`core/authHandler.js`)
7. NoSQL injection (`core/passport.js`)
8. Weak hash in auth flow (`core/authHandler.js`)
9. Hardcoded session secret (`server.js`)
10. Default secret fallback (`models/index.js`)
11. DOM XSS (`views/app/adminusers.ejs`)

### Provisional recall from finalized FN policy

| Tool | TP cases covered | FN cases missed | Recall |
|------|-----------------:|----------------:|-------:|
| VibeScan | 4 | 7 | 36.4% |
| Bearer | 8 | 3 | 72.7% |
| Snyk Code | 7 | 4 | 63.6% |
| eslint-plugin-security | 1 | 10 | 9.1% |
