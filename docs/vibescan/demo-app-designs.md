# Seeded Demo App Designs (Tiny, Rule-Aligned)

Each design is for a *local* intentionally vulnerable app meant for a safe conference demo.

Design principle:

- Every app includes a vulnerable route and a fixed route with the same functional goal.
- VibeScan should flag only the vulnerable route(s) (and ideally not the fixed route), keeping the demo “before/after” unambiguous.

For consistency with the existing VibeScan rule inventory:

- SQLi: `injection.sql.string-concat`
- Path traversal: `injection.path-traversal`
- Missing auth on admin paths: `AUTH-004`
- Webhook signature verification omission: `WEBHOOK-001`

## 1) Seeded SQL injection (string concat)

**App slug:** `sql-injection-seeded` (Express or minimal Node server)

**App purpose**

- Demonstrate SQL injection detection via an obvious string-concatenation sink.

**Vulnerable behavior**

- Endpoint: `GET /vuln/sql?user=...`
- Implementation pattern (high level):

```js
// Vulnerable: concatenates user input into SQL
const sql = "SELECT * FROM users WHERE username = '" + req.query.user + "'";
db.query(sql);
```

- Keep the vulnerable expression clearly visible in the handler (no delegation into a helper module).
- Avoid “real DB harm” by using a stubbed in-memory “query runner” that returns a deterministic result or error message when the input contains a quote.

**Fixed behavior**

- Endpoint: `GET /fixed/sql?user=...`
- Same endpoint goal, but use parameterized queries:

```js
// Fixed: parameterized query
db.query("SELECT * FROM users WHERE username = ?", [req.query.user]);
```

**Automated test idea**

- Test 1 (app-level): call `/vuln/sql?user=%27OR%271%3D1--` and assert the stub reports “syntax error” or a “suspicious input” marker.
- Test 2 (VibeScan scan): run VibeScan on the app directory and assert findings include `injection.sql.string-concat` (and any taint-backed SQL flow IDs used by your output format).
- Test 3 (no false positive): ensure `/fixed/sql` does not produce `injection.sql.string-concat`.

**Expected VibeScan finding**

- Finding rule ID: `injection.sql.string-concat`
- Expected mapping: the vulnerable SQL construction line (handler source) contains the concatenation pattern VibeScan recognizes.

## 2) Seeded path traversal

**App slug:** `path-traversal-seeded`

**App purpose**

- Demonstrate file path traversal detection from user-influenced paths.

**Vulnerable behavior**

- Endpoint: `GET /vuln/file?name=...`
- Implementation pattern (high level):

```js
// Vulnerable: direct join/concatenation without prefix enforcement
const requested = "./files/" + req.query.name;
const content = fileStore.readFile(requested); // fileStore reads from a safe in-memory map
res.send(content);
```

- Do not implement safe normalization/prefix checks in the vulnerable route.
- Use an in-memory `fileStore` (map of allowed file names) to prevent the demo from touching arbitrary disk paths.

**Fixed behavior**

- Endpoint: `GET /fixed/file?name=...`
- Enforce safe resolution:

```js
const normalized = path.posix.normalize(req.query.name).replace(/^(\.\.(\/|\\))+/, "");
const safeName = normalized; // still keep an allowlist to be safe
const content = fileStore.readAllowedFile(safeName);
res.send(content);
```

- The key is the presence of normalization + allowlist/prefix enforcement logic in the fixed route.

**Automated test idea**

- Test 1 (app-level): call `/vuln/file?name=../secrets.txt` and assert the stub returns a “traversal result” or “unexpected lookup” marker.
- Test 2 (VibeScan scan): assert `injection.path-traversal` is present for the vulnerable route.
- Test 3 (no false positive): ensure the fixed route does not trigger `injection.path-traversal`.

**Expected VibeScan finding**

- Finding rule ID: `injection.path-traversal`
- Expected mapping: handler source uses user-influenced path concatenation to a file read sink without safe guard patterns.

## 3) Seeded missing auth on admin route

**App slug:** `missing-auth-admin-seeded`

**App purpose**

- Demonstrate “broken access control at route level” using VibeScan’s admin/mod heuristic.

**Vulnerable behavior**

- Endpoint: `POST /admin/rotate-keys`
- Implementation pattern (high level):

```js
// Vulnerable: no recognizable auth middleware in the route chain
app.post("/admin/rotate-keys", async (req, res) => {
  // Sensitive action without requireAuth / verify session
  res.json({ ok: true, rotated: true });
});
```

- Ensure the route path matches an admin/mod-style heuristic for `AUTH-004` (for example `/admin`, `/moderation`, `/report`, `/keys`, `/rotate`).
- Keep it a minimal Express route graph so VibeScan can analyze middleware chains.

**Fixed behavior**

- Endpoint: `POST /admin/rotate-keys-fixed`
- Same sensitive action, but add an explicit auth middleware:

```js
function requireAuth(req, res, next) { /* deterministic stub */ }
app.post("/admin/rotate-keys-fixed", requireAuth, async (req, res) => {
  res.json({ ok: true, rotated: true });
});
```

**Automated test idea**

- Test 1 (app-level): hit the vulnerable endpoint without headers and assert it returns `200`.
- Test 2 (app-level): hit the fixed endpoint without headers and assert it returns `401` (or a deterministic “unauthenticated” response).
- Test 3 (VibeScan scan): assert `AUTH-004` is raised for the vulnerable route and not raised for the fixed route.

**Expected VibeScan finding**

- Finding rule ID: `AUTH-004`
- Expected mapping: missing recognizable auth middleware on an admin/mod/report-style route.

## 4) Seeded webhook signature verification omission

**App slug:** `webhook-signature-seeded`

**App purpose**

- Demonstrate `WEBHOOK-001` by creating a webhook-like endpoint that reads `req.body` but omits obvious signature verification tokens in the inline handler.

**Vulnerable behavior**

- Endpoint: `POST /webhook/stripe`
- Implementation pattern (high level):

```js
// Vulnerable: reads req.body and processes it without signature verification in handler
app.post("/webhook/stripe", (req, res) => {
  const event = req.body; // req.body used directly
  // Process event fields...
  res.status(200).json({ received: true });
});
```

- Important: keep the signature omission detectable by ensuring the handler itself lacks provider-typical verification calls (e.g., no `constructEvent`, no obvious HMAC compare, no timing-safe compare, no explicit signature header checks).
- Keep it deterministic and local; no real Stripe SDK calls.

**Fixed behavior**

- Endpoint: `POST /webhook/stripe-fixed`
- Use a dedicated verification step and timing-safe comparison:

```js
app.post("/webhook/stripe-fixed", (req, res) => {
  const signature = req.headers["stripe-signature"];
  const rawBody = req.bodyRaw; // set by raw-body middleware in the fixed route

  // Fixed: verify signature before trusting body
  const ok = verifyStripeLikeSignature(rawBody, signature, process.env.WEBHOOK_SECRET);
  if (!ok) return res.status(401).json({ ok: false });

  const event = JSON.parse(rawBody.toString("utf8"));
  res.status(200).json({ received: true });
});
```

- Include raw-body handling (or a mock equivalent) so the verification can plausibly check bytes rather than parsed JSON alone.
- The goal for VibeScan is not cryptographic production correctness; it is the presence of inline verification markers that the heuristic recognizes.

**Automated test idea**

- Test 1 (app-level): call the vulnerable endpoint with any JSON payload and assert `200`.
- Test 2 (app-level): call the fixed endpoint with missing/invalid signature and assert `401`.
- Test 3 (VibeScan scan): assert `WEBHOOK-001` appears for the vulnerable route and does not appear for the fixed route.

**Expected VibeScan finding**

- Finding rule ID: `WEBHOOK-001`
- Expected mapping: webhook-like path + handler uses `req.body` but lacks obvious signature verification logic in the handler source.

## Conference demo scripting suggestion

To keep the demo tight, each app can support a single “scan command” and a single “run command”:

- Run app once, show `/vuln/...` behavior.
- Show VibeScan findings for the vulnerable routes.
- Switch to `/fixed/...` behavior.
- Re-run scan or show that fixed route is not flagged.

