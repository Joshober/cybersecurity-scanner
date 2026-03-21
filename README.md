# VibeScan

**VibeScan** is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP **A02:2021**) and **injection** issues (**A03:2021**), with optional npm **registry checks** for slopsquat-style signals and optional **generated tests**. The npm package is published as `secure-code-scanner`; the CLI binaries are **`vibescan`** and **`secure`**.

**Repository:** [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner)

**VibeScan / conference poster materials:** see [`docs/vibescan/`](docs/vibescan/) (HTML poster, abstract, pitch script, A5 handout, QR SVG, submission checklist).

**Full repo / architecture handoff (for collaborators or LLMs):** [`docs/REPO-HANDOFF.md`](docs/REPO-HANDOFF.md)

**Universal secure-architecture CLI (AI settings + static checks):** [`docs/secure-arch/README.md`](docs/secure-arch/README.md)

---

## Monorepo

This repository is an **npm workspaces** monorepo:

| Package | Description |
|---------|-------------|
| [`packages/secure-code-scanner`](packages/secure-code-scanner/) | VibeScan — JS/TS static scanner (`vibescan` / `secure`) |
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
npx vibescan scan ./packages/secure-code-scanner/src
# or: npx secure scan ./packages/secure-code-scanner/src
```

### secure-arch (architecture settings + validation)

```bash
npx secure-arch install --root .
npx secure-arch check --root . --code-evidence js-ts
```

Requires **Node 18+**.

---

## Why use this tool?

- **OWASP-aligned** — Focus on crypto and injection classes that drive real incidents.
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

**Registry (project-level):** `SLOP-001` (CWE-829) — optional, `--check-registry`.

---

## Usage (CLI)

```bash
npx vibescan scan packages/secure-code-scanner/src
npx vibescan scan packages/secure-code-scanner/src --rules injection,crypto
npx vibescan scan . --format human --fix-suggestions
npx vibescan scan . --check-registry
npx vibescan scan . --check-registry --skip-registry   # offline: skip HEAD requests
npx vibescan scan . --generate-tests ./generated-security-tests
```

| Option | Description |
|--------|-------------|
| `--mode static` \| `ai` | Static rules (default) or LLM-assisted analysis |
| `--rules crypto,injection` | Rule categories |
| `--severity critical\|error\|warning\|info` | Floor for reported findings |
| `--format human\|compact\|json` | Output |
| `--check-registry` | HEAD `registry.npmjs.org` for missing deps (SLOP-001) |
| `--project-root <dir>` | Resolve `package.json` for registry check |

---

## Test

```bash
npm run test
cd packages/secure-code-scanner && npm run test:only   # if that package's `dist/` is already built
```

---

## DVNA evaluation (research)

Benchmark outputs and comparison table live under [`results/`](results/): see [`results/dvna-evaluation.md`](results/dvna-evaluation.md) and [`results/person-b-handoff.md`](results/person-b-handoff.md).

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
packages/secure-code-scanner/
├── src/
│   ├── attacks/       # Rule definitions (crypto, injection, browser, file)
│   └── system/        # Engine, CLI, parser, taint, format, optional AI
└── tests/
    ├── fixtures/
    └── unit/
packages/secure-arch-core/   # Universal architecture rule engine
packages/secure-arch-cli/    # secure-arch CLI
packages/secure-arch-adapters/
architecture/secure-rules/     # AI-maintained settings (templates via secure-arch install)
docs/
├── REPO-HANDOFF.md
├── secure-arch/       # Portable rule system docs
└── vibescan/          # Poster & submission assets
results/               # DVNA benchmark outputs (see dvna-evaluation.md)
```

---

## Scope and limitations

Static analysis cannot prove security; it surfaces high-likelihood patterns. Optional AI mode depends on the configured model. Use as one layer alongside review, tests, and dependency scanning.

---

## License

MIT.
