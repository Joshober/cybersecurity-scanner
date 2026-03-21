# Seeded Benchmark Plan (12 Node/Express Cases)

Goal: define small, auditable benchmark cases mapped to **implemented** VibeScan rules.

## Cases

| Case ID | Vulnerability type | Short app scenario | Vulnerable pattern to seed | Expected VibeScan rule(s) | Baseline may miss? |
|---|---|---|---|---|---|
| SB-01 | Hardcoded secret | Express app signs session/JWT with literal secret | `const SECRET = "supersecretkey"` | `crypto.secrets.hardcoded` | Yes, some generic linters do not focus on weak-secret literals with this specificity |
| SB-02 | Weak env fallback secret | Service reads `process.env.JWT_SECRET || "changeme"` | Literal fallback for missing env | `SEC-004` | Yes, fallback-specific detection is often absent |
| SB-03 | Weak JWT signing key | Login route uses predictable JWT secret | `jwt.sign(payload, "secret123")` | `crypto.jwt.weak-secret-literal` | Possible |
| SB-04 | SQL injection (concat) | `/user?id=...` query endpoint | `db.query("SELECT ... " + req.query.id)` | `injection.sql.string-concat`, possible taint finding (`injection.sql.tainted-flow`) | Less likely for syntax-only tools if pattern differs |
| SB-05 | Command injection | File utility endpoint shells out with user arg | `exec("ls " + req.query.path)` | `injection.command`, taint command-flow finding | Usually detectable, but taint quality varies |
| SB-06 | Path traversal | Download endpoint joins user path directly | `fs.readFile("./files/" + req.params.name)` | `injection.path-traversal` | Possible |
| SB-07 | Log injection | Auth endpoint logs raw username/password line | `logger.info("user=" + req.body.user)` | `injection.log` | Often missed by generic security sets |
| SB-08 | XSS sink | Template endpoint writes user input into HTML sink | `res.send("<div>" + req.query.q + "</div>")` with `innerHTML`-like sink in frontend helper | `injection.xss` | Possible |
| SB-09 | SSRF guard anti-pattern | Outbound fetch guarded only by `ip.isPublic` | URL fetch after weak IP-based gate | `SSRF-003` | Yes, this is specialized |
| SB-10 | axios baseURL bypass pattern | API proxy uses `axios({ baseURL, url: req.query.next })` | User-controlled URL combined with baseURL assumptions | `RULE-SSRF-002` | Yes, this is specialized |
| SB-11 | Slopsquat dependency reference | `package.json` contains non-existent dependency name | e.g. `"expresss": "^4.0.0"` and run with `--check-registry` | `SLOP-001` project-level finding | Yes, source linters generally do not do registry HEAD checks |
| SB-12 | Prototype pollution path/key pattern | Merge/set endpoint accepts attacker-controlled path keys | e.g. `_.set(obj, req.body.path, req.body.value)` with `constructor.prototype` path | taint/prototype findings (e.g. `injection.prototype-pollution.tainted-flow`, `PROTOTYPE_POLLUTION` kind) if triggered by implementation | Often missed or inconsistently flagged |

## Benchmark execution notes

1. Keep each case minimal and isolated to one primary vulnerability pattern.
2. Define one expected vulnerable location per case to simplify adjudication.
3. Run each tool with clearly documented commands and fixed versions.
4. For project-level slopsquat case (SB-11), evaluate separately from line-level static findings.
5. Store all seeded apps and labels in a dedicated benchmark folder (future implementation item).

## Adjudication guidance

- A case counts as TP for a tool when at least one finding correctly maps to the seeded vulnerable location and intended vulnerability type.
- Report partial matches separately (e.g., related warning but not exact seeded mechanism).
- For prototype pollution and SSRF-specialized checks, include reviewer notes because semantic interpretation can vary by tool.

