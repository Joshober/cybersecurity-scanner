# Seeded benchmark plan (design)

## Purpose

DVNA gives **realism** but a small *n* and noisy labels. A **seeded** corpus gives:

- Per-rule **positive** and **negative** examples with **expected** rule IDs (or expected silence).
- Regression support when output format or ordering changes.
- Clearer **precision/recall** stories for specific CWE families.

## Case catalog (initial set)

Goal: define small, auditable benchmark cases mapped to **implemented** VibeScan rules.

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
| SB-13 | OpenAPI drift / API inventory | Express app with routes both inside and outside published OpenAPI | Pair `app.js` + `openapi.yaml` with mismatched paths | `API-INV-001`, `API-INV-002`; optional `API-POSTURE-001`, `AUTH-005` | Yes — typical baselines do not reconcile code routes to a spec |

SB-13 reference implementation: [`tests/fixtures/openapi-drift/`](../../tests/fixtures/openapi-drift/) and [`tests/unit/openapi-drift.test.mjs`](../../tests/unit/openapi-drift.test.mjs).

## Physical layout (repo)

Align with [`benchmarking-runbook.md`](./benchmarking-runbook.md):

```text
benchmarks/seeded/
├── README.md              # Ground-truth table: path → expected rule IDs / none
├── crypto/
├── injection/
├── middleware/            # Express-only cases for AUTH/MW-* if desired
└── mixed/
```

Start by **promoting** high-value cases from [`tests/fixtures/`](../../tests/fixtures/) and inline strings in `tests/unit/*.test.mjs`, then deduplicate.

## Ground-truth table (required)

In `benchmarks/seeded/README.md`, maintain a matrix:

| Relative path | Expect rule IDs (substring or exact) | Expect zero high-severity? | Notes |
|---------------|----------------------------------------|----------------------------|-------|

Use the same `ruleId` strings VibeScan emits (see [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md)).

## Coverage priorities (from current test gaps)

Prioritize seeds for rules that lack dedicated unit tests today, e.g.:

- `crypto.jwt.weak-secret-literal`
- `mw.cookie.missing-flags`
- `RULE-SSRF-002`
- Engine IDs `MW-002`, `MW-003`, `MW-004` (if in scope for the paper)

## Benchmark execution notes

1. Keep each case minimal and isolated to one primary vulnerability pattern.
2. Define one expected vulnerable location per case to simplify adjudication.
3. Run each tool with clearly documented commands and fixed versions.
4. For project-level slopsquat case (SB-11), evaluate separately from line-level static findings.
5. Store all seeded apps and labels in a dedicated benchmark folder (future implementation item).

## Running the seeded suite

Use the same command as DVNA, pointed at `benchmarks/seeded/`:

```bash
npx vibescan scan benchmarks/seeded --format json --project-root benchmarks/seeded > benchmarks/results/<run-id>/vibescan-seeded.json
```

Automated checking can be a **small script** (future work) that parses JSON and compares to the README table—keep it out of the core scanner if you want zero detection churn.

## Adjudication guidance

- A case counts as TP for a tool when at least one finding correctly maps to the seeded vulnerable location and intended vulnerability type.
- Report partial matches separately (e.g., related warning but not exact seeded mechanism).
- For prototype pollution and SSRF-specialized checks, include reviewer notes because semantic interpretation can vary by tool.

## Relationship to academic claims

- **DVNA** supports external validity (“real app”).
- **Seeded** supports internal validity (“rule does what we say on controlled samples”).
- The paper should state which metrics come from which corpus.
