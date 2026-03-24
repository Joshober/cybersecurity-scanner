# VibeScan

**VibeScan** is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP **A02:2021**) and **injection** issues (**A03:2021**), with optional npm **registry checks** for slopsquat-style signals and optional **generated tests**. The npm package is published as `vibescan`; the CLI binaries are **`vibescan`** and **`secure`**.

**Repository:** [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner)

**VibeScan / conference poster materials:** see [`docs/vibescan/`](docs/vibescan/) (HTML poster, abstract, pitch script, A5 handout, QR SVG, submission checklist).

**Verification matrix, pipeline roadmap, AI comparison plan:** [`docs/vibescan/rule-verification-matrix.md`](docs/vibescan/rule-verification-matrix.md) · [`docs/vibescan/pipeline-protection-roadmap.md`](docs/vibescan/pipeline-protection-roadmap.md) · [`docs/vibescan/ai-comparison-study-plan.md`](docs/vibescan/ai-comparison-study-plan.md) · gold-path demo [`benchmarks/gold-path-demo/`](benchmarks/gold-path-demo/).

**Full repo / architecture handoff (for collaborators or LLMs):** [`docs/REPO-HANDOFF.md`](docs/REPO-HANDOFF.md)

**Universal secure-architecture CLI (AI settings + static checks):** [`docs/secure-arch/README.md`](docs/secure-arch/README.md)

---

## Monorepo (scanner under `vibescan/`)

VibeScan’s **scanner** lives under [`vibescan/`](vibescan/) (`vibescan/src/`, `vibescan/dist/`). **secure-arch** packages are nested workspaces for portable YAML settings, architecture checks, and IDE adapters.

| Package | Description |
|---------|-------------|
| **Root** (private workspace) | Monorepo workspace root |
| [`vibescan/`](vibescan/) | Published npm package **`vibescan`** — JS/TS static scanner (`vibescan` / `secure`) — see [`vibescan/README.md`](vibescan/README.md) |
| [`packages/secure-arch-core`](packages/secure-arch-core/) | Portable settings schema, architecture checks, evidence layer |
| [`packages/secure-arch-cli`](packages/secure-arch-cli/) | `secure-arch` CLI (`install`, `init`, `check`) |
| [`packages/secure-arch-adapters`](packages/secure-arch-adapters/) | Cursor / Amazon Q instruction generators |

Repo roles and the “implemented/documented/evaluated/future” maturity legend are documented in [`docs/REPO-HANDOFF.md`](docs/REPO-HANDOFF.md).

**What is published vs workspace-only:** [`docs/MONOREPO-LAYOUT.md`](docs/MONOREPO-LAYOUT.md)

---

## Quick start

```bash
git clone https://github.com/Joshober/cybersecurity-scanner.git
cd cybersecurity-scanner
npm install
npm run build
npx vibescan scan ./vibescan/src
# or: npx secure scan ./vibescan/src
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
| `injection.llm.dynamic-system-prompt` | 74 | Non-literal `system` field may mix instructions with untrusted text |
| `injection.llm.rag-template-mixing` | 74 | Prompt template mentions context/retrieval and embeds expressions |
| `injection.llm.unsafe-html-output` | 79 | `innerHTML` / similar fed from typical LLM output variable names |
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

**Policy bridge (PoC):** [`docs/vibescan/secure-arch-policy-bridge.md`](docs/vibescan/secure-arch-policy-bridge.md) · `npm run policy-check -- docs/samples/policy.sample.json vibescan-out.json` (CI gate) · `npm run policy-eval -- docs/samples/policy.sample.json vibescan-out.json` (JSON summary)

---

## Usage (CLI)

```bash
npx vibescan scan .
npx vibescan scan ./vibescan/src --rules injection,crypto
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
npx vibescan scan ./vibescan/src --export-routes ./out/routes.json   # merged Express routes + tagged inventory (static scan)
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
npx vibescan scan ./vibescan/src --format json --manifest ./out/run-manifest.json --export-adjudication ./out/findings
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
| `--ai-api-url` / `--ai-api-key` / `--ai-model` | Explicit AI provider endpoint/auth/model (overrides environment) |

---

## Test

```bash
npm test -w vibescan
npm run test:arch   # @secure-arch/core (requires build:arch)
```

---

## DVNA evaluation (research)

Benchmark outputs live under [`benchmarks/`](benchmarks/) only: dated runs under [`benchmarks/results/`](benchmarks/results/), and legacy DVNA prose + raw logs under [`benchmarks/results/legacy/`](benchmarks/results/legacy/) (see [`dvna-evaluation.md`](benchmarks/results/legacy/dvna-evaluation.md) and [`person-b-handoff.md`](benchmarks/results/legacy/person-b-handoff.md)). For a **small committable** Express lab (ground truth in-repo), see [`benchmarks/vuln-lab/`](benchmarks/vuln-lab/) and baseline scripts [`benchmarks/scripts/run-vuln-lab-baselines.sh`](benchmarks/scripts/run-vuln-lab-baselines.sh) / [`.ps1`](benchmarks/scripts/run-vuln-lab-baselines.ps1). Project JSON schema (benchmark-oriented): [`docs/vibescan/vibescan-benchmark-output.schema.json`](docs/vibescan/vibescan-benchmark-output.schema.json).

---

## ESLint plugin

Same rules can run inside ESLint (rule IDs match `SEC-004`, `SSRF-003`, `crypto.*`, `injection.*`, etc.):

```javascript
import eslintPluginVibeScan from "vibescan";

export default [
  {
    plugins: { vibescan: eslintPluginVibeScan },
    rules: {
      ...Object.fromEntries(
        Object.keys(eslintPluginVibeScan.rules).map((id) => [
          `vibescan/${id}`,
          "error",
        ])
      ),
    },
  },
];
```

---

## Project structure

See [`docs/REPO-HANDOFF.md`](docs/REPO-HANDOFF.md) for a detailed tree and pipeline. Summary (root = **private monorepo + research shell**; publishable scanner = **`vibescan/`** only):

```
vibescan/
├── src/               # Rule definitions (crypto, injection, browser, file)
│   └── system/        # Engine, CLI, parser, taint, format, optional AI
├── tests/             # Scanner unit tests + fixtures
│   ├── fixtures/
│   └── unit/
packages/
├── secure-arch-core/  # Settings schema + ARCH-* checks + evidence
├── secure-arch-cli/   # secure-arch CLI
└── secure-arch-adapters/
benchmarks/
├── dvna/              # DVNA clone instructions (clone is gitignored)
├── vuln-lab/          # Curated vulnerable Express app (committable “better DVNA” + GROUND_TRUTH.md)
├── seeded/            # Tiny committable benchmark snippets
├── scripts/           # Repro runners (DVNA, Bearer, …)
└── results/           # Timestamped runs + legacy/ (DVNA markdown + raw logs)
demo/                  # Conference / live demo app (separate from benchmarks)
architecture/secure-rules/   # YAML settings (default path for secure-arch install)
docs/
├── REPO-HANDOFF.md    # Architecture + file map for handoffs
├── secure-arch/       # secure-arch usage + AI prompts
├── research-strengthening/
├── samples/           # Example policy JSON (policy-eval bridge)
└── vibescan/          # Poster & submission assets
```

---

## Scope and limitations

Static analysis cannot prove security; it surfaces high-likelihood patterns. Optional AI mode depends on the configured model. Use as one layer alongside review, tests, and dependency scanning.

**LLM and model-plane threats (not fully covered by VibeScan):**

- **Not covered or incomplete:** Runtime **prompt injection** and **jailbreak** testing (the scanner does not call your model). **Training-time data poisoning**, **model inversion** / memorization testing, and behavioral **output manipulation** of the model itself are out of scope for this SAST tool.
- **Supply chain:** `SLOP-001` plus workspace **`npm audit`** catch some dependency risks but not everything (e.g. compromised maintainers, all CVE classes). Prefer pinned versions, a software bill of materials, and registry policies alongside the scanner.
- **Partially related (code only):** Unsafe handling of model-generated text (e.g. XSS-style sinks, including [`injection.llm.unsafe-html-output`](vibescan/src/attacks/injection/llm-integration.ts)) and risky **tool** surfaces reflected in code (command execution, SSRF-style patterns, weak route auth) are flagged where patterns match—they are **not** a substitute for least-privilege connectors, human approval for sensitive tool calls, or runtime monitoring.

Full mapping of these themes to rule IDs, CI, and external controls: [`docs/vibescan/llm-threat-coverage.md`](docs/vibescan/llm-threat-coverage.md).

---

## License

MIT.



