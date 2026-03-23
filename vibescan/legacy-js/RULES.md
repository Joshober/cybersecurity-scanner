# VibeScan — rule specification (summary)

Each rule implements `detect(ctx)` where `ctx` includes parsed files, ASTs, and extracted routes. Findings include `ruleId`, `severity`, `file`, `line`, and a short message.

| ID | Focus | CWE | OWASP | Notes |
|----|--------|-----|-------|--------|
| RULE-INJ-001 | SQL injection | 89 | A03:2021 | `db.query` / `execute` / `knex.raw` with tainted SQL string |
| RULE-INJ-002 | Reflected XSS | 79 | A03:2021 | `res.send` / `innerHTML` with `req` without obvious sanitizer |
| RULE-INJ-003 | Command injection | 78 | A03:2021 | `exec` / `spawn` with `req` |
| RULE-INJ-004 | Path traversal | 22 | A01:2021 | `fs.readFile*`, `res.sendFile`, `path.join` patterns |
| RULE-INJ-005 | SSRF | 918 | A10:2021 | `fetch` / `http(s).get` / `axios` with tainted URL |
| RULE-SSRF-002 | Axios baseURL + tainted url | 918 | A10:2021 | Same scan pass; extra finding on config object |
| RULE-SSRF-003 | `ip.isPublic` / `isPrivate` guard | 918 | A10:2021 | Flags IP-based SSRF “guards” as weak |
| RULE-AUTH-001 | BOLA | 639 | API1:2023 | `findById` / `findOne` + `req.params` without `req.user` use |
| RULE-AUTH-002 | Weak JWT secret | 521 | A02:2021 | `jwt.sign`/`verify` with dictionary literal |
| RULE-AUTH-003 | Missing auth | 306 | A07:2021 | POST/PUT/PATCH/DELETE without named auth middleware |
| RULE-AUTH-004 | Cookie / session flags | 614 | A05:2021 | `res.cookie` / `express-session` `cookie.secure` |
| RULE-MW-001 | CSRF | 352 | A01:2021 | State-changing routes without CSRF middleware names |
| RULE-MW-002 | Rate limit | 770 | API4:2023 | Sensitive paths heuristic |
| RULE-MW-003 | Security headers | 693 | A05:2021 | Missing `helmet()` / manual security headers |
| RULE-MW-004 | CORS wildcard | 942 | A05:2021 | `cors({origin:'*'|true})`, `Access-Control-Allow-Origin: *` |
| RULE-SEC-001 | Hardcoded creds | 798 | A02:2021 | Regex + weak literal assignments |
| RULE-SEC-002 | Env fallback secret | 547 | A02:2021 | `process.env.* \|\| "weak"` |
| RULE-SEC-003 | Dangerous eval | 95 | A03:2021 | `eval` / `new Function` / `setTimeout` with `req` |
| RULE-SEC-004 | JWT env fallback | 547 | A02:2021 | `jwt.sign`/`verify` with env \|\| weak default |
| RULE-PROTO-001 | Unsafe deep merge | 1321 | A08:2021 | lodash merge / `deepmerge` / `express-fileupload` `parseNested` |
| RULE-PROTO-002 | User-controlled path key | 1321 | A08:2021 | `_.set` with tainted path arg |
| SLOP-001 | Registry typo / hallucination | — | A06:2021 | `HEAD` npm registry (optional CLI flag) |

**Pass condition:** no matching pattern in analyzed scope (or risk accepted and suppressed out-of-band).

Payload examples live under [src/payloads/](src/payloads/) for documentation and future test/DAST integration.
