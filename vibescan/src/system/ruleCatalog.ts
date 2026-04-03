// Static reference for rule documentation, confidence hints, and external links.
// Keeps CLI output professional when individual rules do not override fields.

import type { Finding, FindingKind } from "./types.js";

/** Primary documentation for a rule (extends scanner `why` / `fix`). */
export interface RuleDocumentation {
  /** Short title for headers. */
  title: string;
  /** What code or pattern triggers this rule. */
  pattern: string;
  /** Risk in plain language (may duplicate finding.why). */
  risk: string;
  /** When the rule may be overly broad. */
  falsePositives: string;
  /** Actionable remediation (may duplicate finding.fix). */
  remediation: string;
  /** Minimal secure example or pattern. */
  secureExample: string;
  /** OWASP, CWE, or project docs. */
  referenceUrls: string[];
  /** Default confidence when rule matches (0–1). */
  defaultConfidence: number;
}

const DOC_BASE =
  "https://github.com/Joshober/cybersecurity-scanner/blob/main/vibescan/README.md#rule-reference";

function doc(fields: Omit<RuleDocumentation, "referenceUrls"> & { referenceUrls?: string[] }): RuleDocumentation {
  return {
    referenceUrls: fields.referenceUrls?.length ? fields.referenceUrls : [DOC_BASE],
    title: fields.title,
    pattern: fields.pattern,
    risk: fields.risk,
    falsePositives: fields.falsePositives,
    remediation: fields.remediation,
    secureExample: fields.secureExample,
    defaultConfidence: fields.defaultConfidence,
  };
}

const CATALOG: Record<string, RuleDocumentation> = {
  "SEC-004": doc({
    title: "Weak or default secret fallback",
    pattern: "Secret material falls back to a weak literal when env/config is missing.",
    risk: "Deployments without proper env setup silently use attacker-guessable secrets.",
    falsePositives: "Test fixtures with clearly fake literals; ensure production paths use vault/env only.",
    remediation: "Fail closed when secrets are missing; load from a secrets manager or validated env only.",
    secureExample: `const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error("JWT_SECRET required");
`,
    defaultConfidence: 0.88,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/798.html", DOC_BASE],
  }),
  "crypto.jwt.weak-secret-literal": doc({
    title: "JWT signed with a weak known secret",
    pattern: "HS256/HS384/HS512 (or library JWT sign) uses a short dictionary/example secret literal.",
    risk: "Anyone who knows or brute-forces the secret can mint valid tokens.",
    falsePositives: "Literals gated behind isProduction checks; still risky—prefer removing from source.",
    remediation: "Use a high-entropy secret from secure storage; rotate and verify with strong algorithms.",
    secureExample: `// Load secret from env / vault only, 32+ bytes random
jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256" });
`,
    defaultConfidence: 0.9,
    referenceUrls: [
      "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html",
      DOC_BASE,
    ],
  }),
  "crypto.secrets.hardcoded": doc({
    title: "Hardcoded secret material",
    pattern: "API keys, tokens, or passwords embedded as string literals.",
    risk: "Secrets in source leak via git, screenshots, and dependencies.",
    falsePositives: "Public client IDs meant to be public; still move sensitive IDs to config.",
    remediation: "Replace with environment variables, vault references, or runtime injection.",
    secureExample: 'const apiKey = process.env.PAYMENT_API_KEY;\nif (!apiKey) throw new Error("Missing PAYMENT_API_KEY");',
    defaultConfidence: 0.85,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/798.html", DOC_BASE],
  }),
  "crypto.hash.weak": doc({
    title: "Weak cryptographic hash",
    pattern: "MD5, SHA1, or other weak hashes used for sensitive integrity/password workflows.",
    risk: "Fast hashes enable collision and brute-force attacks.",
    falsePositives: "Non-security uses (checksums of public blobs) may be acceptable—suppress with justification.",
    remediation: "Use SHA-256+ for integrity; use Argon2/bcrypt/scrypt for passwords.",
    secureExample: "import { createHash } from 'node:crypto';\nconst h = createHash('sha256').update(data).digest('hex');",
    defaultConfidence: 0.87,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/327.html", DOC_BASE],
  }),
  "crypto.cipher.weak": doc({
    title: "Weak symmetric cipher",
    pattern: "DES, RC4, or other legacy ciphers selected for encryption.",
    risk: "Ciphertext can be recovered with modest effort.",
    falsePositives: "Decrypting legacy backup data—mitigate with suppression documenting scope.",
    remediation: "Prefer AES-GCM or ChaCha20-Poly1305 with proper key management.",
    secureExample:
      "import { createCipheriv, randomBytes } from 'node:crypto';\nconst iv = randomBytes(12);\n// use createCipheriv('aes-256-gcm', key, iv)",
    defaultConfidence: 0.9,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/327.html", DOC_BASE],
  }),
  "crypto.cipher.deprecated": doc({
    title: "Deprecated Node crypto API",
    pattern: "createCipher (no IV) or other deprecated helpers.",
    risk: "Weak or incorrect cryptographic modes; IV handling bugs.",
    falsePositives: "Rare compatibility shims—treat as debt and plan removal.",
    remediation: "Migrate to createCipheriv with explicit IV and AEAD where possible.",
    secureExample: "createCipheriv('aes-256-gcm', key, iv) // never createCipher('aes-256', password)",
    defaultConfidence: 0.92,
    referenceUrls: [DOC_BASE],
  }),
  "crypto.cipher.fixed-iv": doc({
    title: "Fixed or zero IV/nonce",
    pattern: "Initialization vector is constant or all-zero across messages.",
    risk: "Same keystream/nonce reuse breaks confidentiality.",
    falsePositives: "Non-crypto uses mis-detected; verify the call is actually encryption.",
    remediation: "Generate a random IV per message (e.g. randomBytes for GCM).",
    secureExample: "const iv = randomBytes(12);",
    defaultConfidence: 0.86,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/1204.html", DOC_BASE],
  }),
  "crypto.random.insecure": doc({
    title: "Insecure randomness",
    pattern: "Math.random or other non-crypto RNG used for secrets, tokens, or session IDs.",
    risk: "Outputs are predictable; tokens can be guessed.",
    falsePositives: "UI shuffling or game logic only—ok if not security-sensitive.",
    remediation: "Use crypto.randomBytes or Web Crypto getRandomValues for secrets.",
    secureExample: "import { randomBytes } from 'node:crypto';\nconst token = randomBytes(32).toString('base64url');",
    defaultConfidence: 0.88,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/338.html", DOC_BASE],
  }),
  "crypto.tls.reject-unauthorized": doc({
    title: "TLS certificate verification disabled",
    pattern: "rejectUnauthorized: false or insecure TLS context configuration.",
    risk: "Man-in-the-middle attacks against outbound or inbound TLS.",
    falsePositives: "Local dev with documented tooling; never ship to production.",
    remediation: "Keep verify on; fix CA bundles or use proper test certificates.",
    secureExample: "https.request(url, { rejectUnauthorized: true });",
    defaultConfidence: 0.9,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/295.html", DOC_BASE],
  }),
  "injection.sql.string-concat": doc({
    title: "SQL built via string concatenation",
    pattern: "Query strings assembled with user-controlled fragments.",
    risk: "Classic SQL injection leading to data exfiltration or destruction.",
    falsePositives: "Constants only; ensure no dynamic segments from request data.",
    remediation: "Parameterized queries / prepared statements.",
    secureExample: 'db.query("SELECT * FROM u WHERE id = ?", [userId]);',
    defaultConfidence: 0.86,
    referenceUrls: ["https://owasp.org/www-community/attacks/SQL_Injection", DOC_BASE],
  }),
  "injection.sql.tainted-flow": doc({
    title: "SQL injection (taint)",
    pattern: "Dataflow from request/source to SQL sink without sanitization.",
    risk: "Attacker-controlled SQL fragments executed by the app.",
    falsePositives: "Sanitizers AST may not see; verify ORMs and query builders.",
    remediation: "Bind parameters; never interpolate user input into SQL text.",
    secureExample: 'pool.execute("SELECT * FROM posts WHERE id = ?", [id]);',
    defaultConfidence: 0.78,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/89.html", DOC_BASE],
  }),
  "injection.command": doc({
    title: "Command injection (pattern)",
    pattern: "Shell/exec invoked with interpolated user input.",
    risk: "Remote code execution on the host.",
    falsePositives: "Fully static arguments only.",
    remediation: "Avoid shell: spawn with array argv; validate allowlists.",
    secureExample: "import { spawn } from 'node:child_process';\nspawn('convert', [inPath, outPath], { shell: false });",
    defaultConfidence: 0.84,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/78.html", DOC_BASE],
  }),
  "injection.command.tainted-flow": doc({
    title: "Command injection (taint)",
    pattern: "User input reaches exec/spawn with shell or concatenation.",
    risk: "RCE via shell metacharacters.",
    falsePositives: "Library-internal calls; trace carefully.",
    remediation: "No shell, fixed command, validated arguments.",
    secureExample: "execFile('grep', [pattern, file], { shell: false });",
    defaultConfidence: 0.76,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/78.html", DOC_BASE],
  }),
  "injection.eval": doc({
    title: "Dynamic code execution",
    pattern: "eval, new Function, or similar with influenced input.",
    risk: "Arbitrary code execution in-process.",
    falsePositives: "Build-time only tools—move out of runtime paths.",
    remediation: "Remove eval; use parsers, safe DSLs, or structured data formats.",
    secureExample: "JSON.parse(userJson) // with size limits and validation",
    defaultConfidence: 0.9,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/94.html", DOC_BASE],
  }),
  "injection.path-traversal": doc({
    title: "Path traversal (pattern)",
    pattern: "Filesystem calls combine user paths without normalization/allowlists.",
    risk: "Read/write arbitrary files outside intended directory.",
    falsePositives: "Chrooted or strictly allowlisted roots.",
    remediation: "resolve + startsWith root check; use path.basename for names only.",
    secureExample:
      "import { resolve } from 'node:path';\nconst safe = resolve(baseDir, path.basename(userInput));\nif (!safe.startsWith(baseDir)) throw new Error('Invalid path');",
    defaultConfidence: 0.82,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/22.html", DOC_BASE],
  }),
  "injection.path-traversal.tainted-flow": doc({
    title: "Path traversal (taint)",
    pattern: "User input flows into fs.readFile / similar without boundary checks.",
    risk: "Unauthorized file access.",
    falsePositives: "Heuristic flow gaps—verify manually.",
    remediation: "Centralize safe path join and audit all fs entry points.",
    secureExample: "// same as pattern-based: anchored resolve under a trusted root",
    defaultConfidence: 0.74,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/22.html", DOC_BASE],
  }),
  "injection.xss": doc({
    title: "DOM XSS",
    pattern: "innerHTML, document.write, or similar with dynamic HTML.",
    risk: "Session/cookie theft via injected scripts.",
    falsePositives: "Trusted static markup only—prefer textContent or framework escaping.",
    remediation: "Encode context-appropriate output; use CSP; avoid raw HTML sinks.",
    secureExample: "el.textContent = userName;",
    defaultConfidence: 0.8,
    referenceUrls: ["https://owasp.org/www-community/attacks/xss/", DOC_BASE],
  }),
  "injection.xss.react-dangerously-set-inner-html": doc({
    title: "React dangerouslySetInnerHTML with dynamic HTML",
    pattern: "dangerouslySetInnerHTML / __html with a non-literal expression (including JSX attributes).",
    risk: "React does not escape __html; attacker-controlled strings become real DOM and scripts.",
    falsePositives: "Carefully sanitized HTML from a trusted server-side pipeline.",
    remediation: "Prefer plain text or framework components; sanitize HTML with a maintained library if you must render HTML.",
    secureExample: '<div>{markdownToSafeReact(children)}</div> // not raw __html from users',
    defaultConfidence: 0.82,
    referenceUrls: ["https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html", DOC_BASE],
  }),
  "injection.xss.angular-sanitizer-bypass": doc({
    title: "Angular DomSanitizer bypass with dynamic content",
    pattern: "bypassSecurityTrustHtml / Script / Style / Url / ResourceUrl with non-literal arguments.",
    risk: "Bypass methods disable Angular sanitization; XSS if the value is user-influenced.",
    falsePositives: "Hard-coded trusted snippets only—still prefer non-bypass APIs where possible.",
    remediation: "Never pass user input to bypassSecurityTrust*; sanitize and use safe bindings.",
    secureExample: "// Prefer bound text or DomSanitizer.sanitize with strict context",
    defaultConfidence: 0.84,
    referenceUrls: ["https://angular.dev/best-practices/security/", DOC_BASE],
  }),
  "injection.noql": doc({
    title: "NoSQL injection",
    pattern: "Mongo-style operators ($where) or concatenated filter objects.",
    risk: "Auth bypass or data leaks in document stores.",
    falsePositives: "ODM/helpers may sanitize—confirm.",
    remediation: "Typed queries; forbid raw object spread from user JSON.",
    secureExample: 'collection.find({ _id: new ObjectId(id) });',
    defaultConfidence: 0.82,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/943.html", DOC_BASE],
  }),
  "injection.xpath": doc({
    title: "XPath injection (pattern)",
    pattern: "XPath built via string concat with user input.",
    risk: "Data exfiltration from XML stores.",
    falsePositives: "Fully static XPath literals.",
    remediation: "Parameterized XPath APIs or strict allowlisting.",
    secureExample: "// Use XPath variables / bound parameters supported by your parser",
    defaultConfidence: 0.8,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/643.html", DOC_BASE],
  }),
  "injection.xpath.tainted-flow": doc({
    title: "XPath injection (taint)",
    pattern: "Tainted input flows into XPath evaluation.",
    risk: "Blind XPath extraction or logic bypass.",
    falsePositives: "Flow engine limitations.",
    remediation: "Never concatenate user strings into XPath text.",
    secureExample: "// Bind user input as a typed variable, not string splice",
    defaultConfidence: 0.74,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/643.html", DOC_BASE],
  }),
  "injection.log": doc({
    title: "Log injection (pattern)",
    pattern: "User data written to logs without newline/control stripping.",
    risk: "Forged log lines, log forgery, downstream parser confusion.",
    falsePositives: "Structured logging with JSON encode may already escape.",
    remediation: "Strip CR/LF; bound length; structured logs.",
    secureExample: "logger.info({ user: userId, msg: message.replace(/[\\r\\n]/g, ' ') });",
    defaultConfidence: 0.78,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/117.html", DOC_BASE],
  }),
  "injection.log.tainted-flow": doc({
    title: "Log injection (taint)",
    pattern: "Request data reaches logging sinks.",
    risk: "Injected delimiters break SIEM parsing or confuse operators.",
    falsePositives: "Encoded single-line JSON blobs.",
    remediation: "Central log sanitization middleware.",
    secureExample: "logger.info(JSON.stringify({ event: 'auth', uid: String(uid).slice(0, 64) }));",
    defaultConfidence: 0.72,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/117.html", DOC_BASE],
  }),
  "injection.prototype-pollution.tainted-flow": doc({
    title: "Prototype pollution",
    pattern: "Deep merge / recursive assign with user-controlled objects or keys.",
    risk: "Global object prototype mutation affecting all objects.",
    falsePositives: "Libraries with internal hardcoded objects only.",
    remediation: "Use Object.create(null) for maps; reject __proto__/constructor; shallow merge allowlists.",
    secureExample:
      "function safeAssign(target, patch) {\n  for (const k of Object.keys(patch)) {\n    if (k === '__proto__' || k === 'constructor') continue;\n    target[k] = patch[k];\n  }\n}",
    defaultConfidence: 0.77,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/1321.html", DOC_BASE],
  }),
  "injection.ssrf.tainted-flow": doc({
    title: "Server-side request forgery (taint)",
    pattern: "User-controlled URL/host flows to HTTP client without egress controls.",
    risk: "Access to cloud metadata, internal APIs, or port scanning from server.",
    falsePositives: "Hooks with strict allowlists the static analysis missed.",
    remediation: "Allowlist hosts; block private/link-local ranges; resolve and validate.",
    secureExample:
      "const u = new URL(raw);\nif (!ALLOW.has(u.hostname)) throw new Error('host');\nawait fetch(u);",
    defaultConfidence: 0.76,
    referenceUrls: ["https://owasp.org/www-community/attacks/Server_Side_Request_Forgery", DOC_BASE],
  }),
  "RULE-SSRF-002": doc({
    title: "Axios/fetch base URL with tainted relative path",
    pattern: "HTTP client combines a fixed base with user-controlled relative URL segments.",
    risk: "SSRF or open redirect chains into internal networks.",
    falsePositives: "Relative paths fully validated upstream.",
    remediation: "Validate path starts with / safe segments; disallow scheme-relative escapes.",
    secureExample: "const path = '/' + segments.map(encodeURIComponent).join('/');",
    defaultConfidence: 0.74,
    referenceUrls: ["https://cwe.mitre.org/data/definitions/918.html", DOC_BASE],
  }),
  "SSRF-003": doc({
    title: "SSRF guard heuristic",
    pattern: "Outbound request without obvious IP/host guard for tainted URLs.",
    risk: "May indicate missing SSRF defenses (heuristic).",
    falsePositives: "Guards implemented in other modules or runtime policies.",
    remediation: "Confirm allowlists, DNS pinning, or service mesh egress rules.",
    secureExample: "// Combine with network policy + code-level URL validation",
    defaultConfidence: 0.65,
    referenceUrls: [DOC_BASE],
  }),
  "mw.cookie.missing-flags": doc({
    title: "Session cookie missing security flags",
    pattern: "Set-Cookie missing httpOnly and/or secure in Express-style handlers.",
    risk: "Token theft via XSS or downgraded connections.",
    falsePositives: "Intentionally public cookies (not session tokens).",
    remediation: "httpOnly: true, secure: true, sameSite: 'strict' or 'lax'.",
    secureExample: "res.cookie('sid', value, { httpOnly: true, secure: true, sameSite: 'strict' });",
    defaultConfidence: 0.83,
    referenceUrls: ["https://owasp.org/www-community/controls/SecureCookieAttribute", DOC_BASE],
  }),
  "SLOP-001": doc({
    title: "Dependency slopsquat candidate",
    pattern: "Declared package name not found on the configured npm registry (404).",
    risk: "Typosquatting or dependency confusion—malicious package may be published later.",
    falsePositives: "Private packages when registry probe points at npmjs; VPN/registry mirror issues.",
    remediation: "Verify package spelling; scope packages; use private registry with auth.",
    secureExample: "// .npmrc pointing to corporate registry for @scope/*",
    defaultConfidence: 0.62,
    referenceUrls: [DOC_BASE],
  }),
  "AUTH-003": doc({
    title: "Missing auth middleware",
    pattern: "Sensitive route has no auth middleware in Express graph.",
    risk: "Unauthenticated access to privileged operations.",
    falsePositives: "Global auth in unmodeled wrapper; non-Express frameworks.",
    remediation: "Attach requireAuth (or equivalent) before handlers on sensitive verbs.",
    secureExample: "router.post('/admin/users', requireAuth, requireRole('admin'), handler);",
    defaultConfidence: 0.72,
    referenceUrls: ["https://owasp.org/Top10/A01_2021-Broken_Access_Control/", DOC_BASE],
  }),
  "AUTH-004": doc({
    title: "Admin route without auth",
    pattern: "POST/PUT/DELETE on admin-like path lacks auth middleware.",
    risk: "Direct object manipulation or admin takeover.",
    falsePositives: "Edge proxies enforce auth.",
    remediation: "Model auth in app code and test negative cases.",
    secureExample: "// same as AUTH-003",
    defaultConfidence: 0.73,
    referenceUrls: [DOC_BASE],
  }),
  "AUTH-005": doc({
    title: "Auth middleware ordering gap",
    pattern: "Auth middleware present but ordered after handler or wrong mount.",
    risk: "Handler runs without intended protection.",
    falsePositives: "Per-route auth inside sub-routers.",
    remediation: "Ensure middleware runs before handlers on same path prefix.",
    secureExample: "app.use('/api', authMiddleware);",
    defaultConfidence: 0.7,
    referenceUrls: [DOC_BASE],
  }),
  "MW-001": doc({
    title: "Middleware ordering risk",
    pattern: "Security middleware (e.g. helmet) applied late in chain.",
    risk: "Responses skip intended hardening.",
    falsePositives: "Custom ordering for valid reasons—document in suppression.",
    remediation: "Place security headers and parsers in documented order early.",
    secureExample: "app.use(helmet());\napp.use(express.json({ limit: '100kb' }));",
    defaultConfidence: 0.68,
    referenceUrls: [DOC_BASE],
  }),
  "MW-002": doc({
    title: "Missing rate limit on sensitive route",
    pattern: "Login/register/report paths lack explicit rate limiting middleware.",
    risk: "Credential stuffing and abuse of expensive endpoints.",
    falsePositives: "CDN/WAF rate limits; separate gateway.",
    remediation: "Add rateLimit with tuned thresholds per route class.",
    secureExample: "const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });\nrouter.post('/login', loginLimit, handler);",
    defaultConfidence: 0.7,
    referenceUrls: [DOC_BASE],
  }),
  "MW-003": doc({
    title: "Security header gap (heuristic)",
    pattern: "App-level audit suspects missing helmet-style headers.",
    risk: "Clickjacking, MIME sniffing, XSS without defense-in-depth.",
    falsePositives: "Headers set at reverse proxy.",
    remediation: "Align app + edge header policy; verify with integration tests.",
    secureExample: "app.use(helmet({ contentSecurityPolicy: { directives: { ... } } }));",
    defaultConfidence: 0.66,
    referenceUrls: [DOC_BASE],
  }),
  "MW-004": doc({
    title: "CORS mis-configuration heuristic",
    pattern: "Wildcard or reflective CORS origins detected heuristically.",
    risk: "Cross-origin token theft if credentials allowed.",
    falsePositives: "Public APIs without cookies.",
    remediation: "Explicit allowlist; careful use of credentials: true.",
    secureExample: "cors({ origin: ['https://app.example.com'], credentials: true })",
    defaultConfidence: 0.67,
    referenceUrls: [DOC_BASE],
  }),
  "WEBHOOK-001": doc({
    title: "Webhook without signature verification",
    pattern: "POST /webhook uses raw body without constructEvent/signature checks.",
    risk: "Forged events / replay against your integration.",
    falsePositives: "Verification in upstream gateway.",
    remediation: "Verify HMAC or provider SDK signature before processing.",
    secureExample: "const evt = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);",
    defaultConfidence: 0.74,
    referenceUrls: [DOC_BASE],
  }),
  "API-POSTURE-001": doc({
    title: "API posture / sensitive route inventory",
    pattern: "Heuristic tags on routes (admin, upload, webhook) for review.",
    risk: "Operational visibility—routes may need extra controls.",
    falsePositives: "Naming false positives; confirm with product owners.",
    remediation: "Review tagged routes for authz, rate limits, and monitoring.",
    secureExample: "// Document trust boundaries in OpenAPI + architecture YAML",
    defaultConfidence: 0.6,
    referenceUrls: [DOC_BASE],
  }),
  "API-INV-001": doc({
    title: "Undocumented API route (OpenAPI drift)",
    pattern: "Express route exists with no matching OpenAPI operation.",
    risk: "Hidden endpoints skip contract tests, gateway policy, and review.",
    falsePositives: "Non-Express servers, dynamic routes, or multi-service graphs.",
    remediation: "Add the operation to OpenAPI or document why it is out of scope.",
    secureExample: "// Mirror routes in openapi.yaml with security schemes",
    defaultConfidence: 0.68,
    referenceUrls: ["https://owasp.org/www-project-api-security/", DOC_BASE],
  }),
  "API-INV-002": doc({
    title: "Ghost OpenAPI operation",
    pattern: "Spec declares an operation static Express extraction did not find.",
    risk: "Dead documentation confuses consumers; may hide removed attack surface.",
    falsePositives: "Handlers in another language, gateway-only routes.",
    remediation: "Remove stale spec paths or align code with the published contract.",
    secureExample: "// Keep OpenAPI generated from code or vice versa",
    defaultConfidence: 0.65,
    referenceUrls: ["https://owasp.org/www-project-api-security/", DOC_BASE],
  }),
  "API-AUTH-001": doc({
    title: "OpenAPI security requirement vs static middleware",
    pattern: "Operation declares security in OpenAPI; Express route graph shows no recognizable auth middleware.",
    risk: "Contract says authenticated; static analysis suggests a public handler—verify authorization.",
    falsePositives: "Custom auth wrappers, gateway auth, or non-Express stacks.",
    remediation: "Add middleware matching your spec security scheme or align the spec with deployment behavior.",
    secureExample: "// app.use('/api', authenticate); app.get('/items/:id', handler)",
    defaultConfidence: 0.62,
    referenceUrls: ["https://owasp.org/www-project-api-security/", DOC_BASE],
  }),
};

const GENERIC: RuleDocumentation = doc({
  title: "Security finding",
  pattern: "Heuristic or rule match in VibeScan static analysis.",
  risk: "May indicate a vulnerability class—triage with context.",
  falsePositives: "Static analysis can miss runtime guards; confirm with code review.",
  remediation: "Follow the scanner message and team standards; add tests.",
  secureExample: "// Consult internal secure coding guidelines for this stack",
  defaultConfidence: 0.75,
});

function prefixMatch(id: string): RuleDocumentation | undefined {
  const parts = id.split(".");
  while (parts.length > 1) {
    parts.pop();
    const p = parts.join(".");
    if (CATALOG[p]) return CATALOG[p];
  }
  return undefined;
}

/** Full documentation block for a rule id. */
export function getRuleDocumentation(ruleId: string): RuleDocumentation {
  return CATALOG[ruleId] ?? prefixMatch(ruleId) ?? GENERIC;
}

function confidenceFromSignals(f: Finding): number {
  const kind = f.findingKind as FindingKind | undefined;
  if (kind === "SLOPSQUAT_CANDIDATE" || kind === "POSSIBLY_PRIVATE" || f.ruleId === "SLOP-001") {
    return 0.62;
  }
  if (f.sourceLabel && f.sinkLabel) return 0.78;
  if (f.ruleId.startsWith("AUTH-") || f.ruleId.startsWith("MW-")) return 0.71;
  if (f.ruleId.startsWith("API-")) return 0.63;
  return getRuleDocumentation(f.ruleId).defaultConfidence;
}

/** Confidence score (0–1) for display and JSON export. */
export function getConfidenceScore(finding: Finding): number {
  return Math.round(confidenceFromSignals(finding) * 100) / 100;
}

export const RULE_REFERENCE_README_ANCHOR = DOC_BASE;
