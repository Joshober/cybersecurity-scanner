# VibeScan

**VibeScan** is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP **A02:2021**) and **injection** issues (**A03:2021**), with optional npm **registry checks** for slopsquat-style signals and optional **generated tests**. The npm package is published as `secure-code-scanner`; the CLI binaries are **`vibescan`** and **`secure`**.

**Repository:** [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner)

**VibeScan / conference poster materials:** see [`docs/vibescan/`](docs/vibescan/) (HTML poster, abstract, pitch script, A5 handout, QR SVG, submission checklist).

**Full repo / architecture handoff (for collaborators or LLMs):** [`docs/REPO-HANDOFF.md`](docs/REPO-HANDOFF.md)

**Universal secure-architecture CLI (AI settings + static checks):** [`docs/secure-arch/README.md`](docs/secure-arch/README.md)

---

## Monorepo (scanner at repo root)

VibeScan’s **scanner** lives at the repository root (`src/`, `dist/`). **secure-arch** packages are nested workspaces for portable YAML settings, architecture checks, and IDE adapters—optional and separate from publishing `secure-code-scanner`.

| Package | Description |
|---------|-------------|
| **Root** (`secure-code-scanner`) | VibeScan — JS/TS static scanner (`vibescan` / `secure`) |
| [`vibescan/`](vibescan/) | Standalone **`vibescan`** package (Babel extractor, route graph, rules CLI) — see [`vibescan/README.md`](vibescan/README.md) |
| [`packages/secure-arch-core`](packages/secure-arch-core/) | Portable settings schema, architecture checks, evidence layer |
| [`packages/secure-arch-cli`](packages/secure-arch-cli/) | `secure-arch` CLI (`install`, `init`, `check`) |
| [`packages/secure-arch-adapters`](packages/secure-arch-adapters/) | Cursor / Amazon Q instruction generators |

---

## Quick start

```bash
git clone https://github.com/Joshober/cybersecurity-scanner.git
cd cybersecurity-scanner
npm install
npm run build
npx vibescan scan ./src
# or: npx secure scan ./src
```

### secure-arch (architecture settings + validation)

```bash
npm run build:arch
npx secure-arch install --root .
npx secure-arch check --root . --code-evidence js-ts
```

Requires **Node 18+**.

---

## Why use this tool?

- **OWASP-aligned** — Crypto and injection classes, plus Express **route/middleware** heuristics and optional **OpenAPI vs code** drift (API inventory).
- **Shift-left** — CI, pre-commit, or ESLint integration.
- **Actionable** — Findings include *why* and *how to fix*; several rules carry **CWE** metadata.
- **Optional checks** — `--check-registry` for dependency names that 404 on the public npm registry; `--generate-tests` for stub security tests.

---

## Rule list (pattern rules + primary CWE)

Taint engine adds additional findings (e.g. `injection.sql.tainted-flow`) with CWE on the report where applicable.

| Rule ID | CWE | Description |
|--------|-----|-------------|
| `crypto.hash.weak` | 327 | MD5 / SHA-1 style hashing |
| `crypto.cipher.weak` | 327 | DES / RC4 / weak suites |
| `crypto.cipher.deprecated` | 327 | Legacy OpenSSL APIs (`createCipher`, etc.) |
| `crypto.cipher.fixed-iv` | 329 | Static / zero IV misuse |
| `crypto.random.insecure` | 330 | `Math.random()` for secret material |
| `crypto.secrets.hardcoded` | 798 | Hardcoded secret literals |
| `SEC-004` | 547 | Weak `process.env.X \|\| 'literal'` fallback |
| `crypto.jwt.weak-secret-literal` | 347 | JWT signed with guessable secret |
| `crypto.tls.reject-unauthorized` | 295 | `rejectUnauthorized: false` |
| `injection.eval` | 94 | `eval` / `new Function` |
| `injection.sql.string-concat` | 89 | SQL via string concat / templates |
| `injection.command` | 78 | Shell command construction |
| `injection.path-traversal` | 22 | User-influenced file paths |
| `injection.xss` | 79 | `innerHTML` / `document.write` with dynamic data |
| `injection.noql` | 943 | NoSQL injection patterns |
| `injection.xpath` | 643 | XPath injection |
| `injection.log` | 117 | Log injection via unsanitized input |
| `mw.cookie.missing-flags` | 614 | Session cookies missing `HttpOnly` / `Secure` |
| `SSRF-003` | 918 | `ip.isPublic` / `ip.isPrivate` gating outbound HTTP |
| `RULE-SSRF-002` | 918 | axios `baseURL` + user-controlled URL risk |
| `AUTH-003` | 285 | State-changing route on **sensitive** paths (login, upload, webhook, etc.) without recognizable auth middleware (heuristic; narrowed to reduce noise) |
| `AUTH-004` | 285 | Admin/mod/report-style path without auth (heuristic) |
| `AUTH-005` | 285 | Object-scoped GET/HEAD without recognizable auth middleware (BOLA/IDOR prep; heuristic) |
| `API-INV-001` | 284 | Express route missing from OpenAPI/Swagger inventory (when spec provided) |
| `API-INV-002` | 284 | OpenAPI operation not matched to static Express route (ghost doc or graph gap) |
| `API-POSTURE-001` | 285 | Aggregate: object-scoped routes lack auth middleware (informational) |
| `MW-001` | 352 | Missing CSRF protection on state-changing route |
| `MW-002` | 307 | Sensitive path without rate-limit middleware |
| `MW-003` | 693 | Express app with routes but no `helmet()` in file |
| `MW-004` | 942 | CORS `origin: '*'` |
| `WEBHOOK-001` | 345 | Webhook-like path uses body without obvious signature verification |

**Registry (project-level):** `SLOP-001` (CWE-829) — optional, `--check-registry`.

**Policy bridge (PoC):** [`docs/vibescan/secure-arch-policy-bridge.md`](docs/vibescan/secure-arch-policy-bridge.md) · `node scripts/policy-eval.mjs scripts/policy.sample.json vibescan-out.json`

---

## Usage (CLI)

```bash
npx vibescan scan .
npx vibescan scan src --rules injection,crypto
npx vibescan scan . --format human --fix-suggestions
npx vibescan scan . --format json          # stdout: JSON + summary (even when 0 findings); progress on stderr
npx vibescan scan . --format sarif         # SARIF 2.1.0 for CI / GitHub Advanced Security upload
npx vibescan scan . --exclude-vendor       # skip node_modules, dist, *.min.js, vendor trees, etc.
npx vibescan scan . --check-registry
npx vibescan scan . --check-registry --skip-registry   # offline: skip HEAD requests
npx vibescan scan . --generate-tests ./generated-security-tests
npx vibescan scan . --openapi-spec ./openapi.yaml   # repeat flag for multiple specs; disables auto-discovery
npx vibescan scan . --no-openapi-discovery
npx vibescan scan . --build-id "$(git rev-parse --short HEAD)"
npx vibescan scan ./src --export-routes ./out/routes.json   # merged Express routes + tagged inventory (static scan)
```

### `vibescan.config.json` (optional)

Place next to the project or any parent directory (or pass `--config <path>`). CLI flags override file values.

```json
{
  "schemaVersion": "1",
  "rules": { "crypto": true, "injection": true },
  "severityThreshold": "warning",
  "ignore": ["**/fixtures/**", "**/*.spec.ts"],
  "excludeVendor": true,
  "format": "json",
  "registry": { "checkRegistry": false, "skipRegistry": false },
  "suppressions": [{ "ruleId": "MW-003", "file": "legacy/server.js" }],
  "openApiSpecPaths": ["./openapi.yaml"],
  "openApiDiscovery": true,
  "buildId": "ci-1234"
}
```

### Benchmark / adjudication exports

```bash
npx vibescan scan ./src --format json --manifest ./out/run-manifest.json --export-adjudication ./out/findings
# writes run-manifest.json, findings.json, findings.csv (stem from --export-adjudication)
```

Project JSON includes `summary` (`totalFindings`, `bySeverity`, `byRuleId`, `byCategory`), **`routeInventory`** (per route: `path`, `fullPath`, `middlewares`, heuristic **`tags`** such as `admin`, `auth-sensitive`, `upload`, `webhook`, plus boolean labels), optional **`openApiSpecsUsed`**, optional **`buildId`**, and each finding includes `file` (canonical path) plus `filePath`. Graph-derived findings may include **`route`** (`method`, `path`, `fullPath`, `middlewares`). **AI mode** `--format json` uses the same `summary` plus a `results` array (per-file groups), not a bare array.

**Breaking note (AI / `formatJson`):** multi-file AI JSON is now `{ summary, results }` instead of a top-level array only.

| Option | Description |
|--------|-------------|
| `--mode static` \| `ai` | Static rules (default) or LLM-assisted analysis |
| `--rules crypto,injection` | Rule categories |
| `--severity critical\|error\|warning\|info` | Floor for reported findings |
| `--format human\|compact\|json\|sarif` | Output |
| `--exclude-vendor` | Skip vendor/minified trees when collecting files |
| `--ignore-glob <pat>` | Extra picomatch glob (relative to `--project-root` / scan root); repeatable |
| `--benchmark-metadata` | JSON: stable-sorted findings, optional `run{}`, `summary.findingsPerFile`, `ruleFamily` per finding; or set `VIBESCAN_BENCHMARK=1` |
| `--config <path>` | Use explicit `vibescan.config.json` |
| `--manifest <path>` | Write run manifest JSON (tool versions, scope, outputs) |
| `--export-adjudication <stem>` | Write `<stem>.json` and `<stem>.csv` (one row per finding) |
| `--export-routes <path>` | Write `routeInventory` + raw `routes` JSON (static multi-file scan only) |
| `--check-registry` | HEAD `registry.npmjs.org` for missing deps (SLOP-001) |
| `--project-root <dir>` | Resolve `package.json`, OpenAPI discovery root, registry check, ignore globs |
| `--openapi-spec <file>` | OpenAPI/Swagger file for drift vs Express routes (repeatable) |
| `--no-openapi-discovery` | Skip auto-discovery of `openapi.*` / `swagger.*` under project root |
| `--build-id <id>` | Label JSON output and `--manifest` scope for deployment correlation |

---

## Test

```bash
npm run test
npm run test:only   # if `dist/` is already built
npm run test:arch   # @secure-arch/core (requires build:arch)
```

---

## DVNA evaluation (research)

Benchmark outputs and comparison table live under [`results/`](results/) (legacy captures) and [`benchmarks/`](benchmarks/) (layout, scripts, dated runs): see [`results/dvna-evaluation.md`](results/dvna-evaluation.md) and [`results/person-b-handoff.md`](results/person-b-handoff.md). Project JSON schema (benchmark-oriented): [`docs/vibescan/vibescan-benchmark-output.schema.json`](docs/vibescan/vibescan-benchmark-output.schema.json).

---

## ESLint plugin

Same rules can run inside ESLint (rule IDs match `SEC-004`, `SSRF-003`, `crypto.*`, `injection.*`, etc.):

```javascript
import eslintPluginSecureCodeScanner from "secure-code-scanner";

export default [
  {
    plugins: { "secure-code-scanner": eslintPluginSecureCodeScanner },
    rules: {
      ...Object.fromEntries(
        Object.keys(eslintPluginSecureCodeScanner.rules).map((id) => [
          `secure-code-scanner/${id}`,
          "error",
        ])
      ),
    },
  },
];
```

---

## Project structure

See [`docs/REPO-HANDOFF.md`](docs/REPO-HANDOFF.md) for a detailed tree and pipeline. Summary:

```
src/
├── attacks/           # Rule definitions (crypto, injection, browser, file)
└── system/            # Engine, CLI, parser, taint, format, optional AI
packages/
├── secure-arch-core/  # Settings schema + ARCH-* checks + evidence
├── secure-arch-cli/   # secure-arch CLI
└── secure-arch-adapters/
architecture/secure-rules/   # YAML settings (templates via secure-arch install)
tests/
├── fixtures/
└── unit/
docs/
├── REPO-HANDOFF.md    # Architecture + file map for handoffs
├── secure-arch/       # secure-arch usage + AI prompts
├── research-strengthening/
└── vibescan/          # Poster & submission assets
results/               # DVNA benchmark outputs (see dvna-evaluation.md)
```

---

## Scope and limitations

Static analysis cannot prove security; it surfaces high-likelihood patterns. Optional AI mode depends on the configured model. Use as one layer alongside review, tests, and dependency scanning.

---

## License

MIT.
