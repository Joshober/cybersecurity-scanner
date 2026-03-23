# Platform and API benchmark plan (seeded cases)

Seeded benchmarks support **adjudicated** evaluation. **Expected baseline coverage** is described **qualitatively** (e.g., “dependency scanners typically ignore first-party route middleware”)—no fabricated percentages.

| Case ID | Scenario | Seeded vulnerability | Expected VibeScan rule(s) | Expected baseline coverage (qualitative) |
|---------|----------|----------------------|---------------------------|------------------------------------------|
| B-UE-01 | Express app with extra `app.post` not listed in any spec | Undocumented endpoint in operations | Route appears in `routes` / `routeInventory`; no drift rule yet | DAST may find only if reachable; SCA silent |
| B-AUTH-01 | `POST /login` with no limiter middleware in chain | Credential stuffing friendly | `MW-002` (sensitive path, no rate limit) | DAST may infer indirectly; SAST varies |
| B-AUTH-02 | `POST /admin/users` no auth middleware | Broken access control at route level | `AUTH-004` | DAST needs credentials; SCA silent |
| B-AUTH-03 | `POST /reports/flag` no auth | Moderation abuse | `AUTH-004` | Similar to B-AUTH-02 |
| B-RL-01 | `POST /register` without `rateLimit` in chain | Abuse-prone signup | `MW-002` | Same family as B-AUTH-01 |
| B-ADM-01 | `DELETE /delete-user/:id` without role middleware | Weak admin protection | `AUTH-004` | SCA silent |
| B-UPL-01 | `POST /upload` with path concatenation sink | Unsafe file handling | Injection/path rules + `MW-002` for limiter | DAST may need file upload harness |
| B-WH-01 | `POST /webhook/stripe` reads `req.body`, no signature hints | Missing verification | `WEBHOOK-001` | DAST rarely validates signature logic |
| B-SSRF-01 | URL preview `fetch(userUrl)` to SSRF sink | SSRF | Existing SSRF/taint rules where seeded | DAST may catch if endpoint exposed |
| B-DEP-01 | `package.json` references non-existent typo-squat name | Supply-chain style risk | `SLOP-001` (with registry check) | Snyk/npm audit differ in mechanism |

## Protocol notes

- Run VibeScan with the same `--exclude-vendor` (or file list) policy as other tools when comparing first-party code.
- Record Node version, config path, and rule toggles in the run manifest.
- Adjudicate each finding: TP / FP / unknown vs benchmark intent.
