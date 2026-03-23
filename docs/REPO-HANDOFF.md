# VibeScan repository handoff (for collaborators / LLMs)

This document summarizes **what the repo is**, **how the scanner works**, **what is implemented**, and **where files live**. Paste or attach it when onboarding a new assistant.

**Related:** [README.md](../README.md) (install, CLI, rule×CWE table) · [docs/research-strengthening/](research-strengthening/) (RQ, methodology, evaluation plan, metrics, merge strategy) · [docs/secure-arch/](secure-arch/) (universal architecture rule pack + `secure-arch` CLI) · [docs/vibescan/](vibescan/) (poster, abstract, pitch, checklist) · [results/](../results/) (DVNA benchmark, Person B stats).

---

## Product identity

| Item | Value |
|------|--------|
| **Product name** | VibeScan |
| **npm package** | `secure-code-scanner` (published from **repo root**; scanner `src/` lives here) |
| **CLI binaries** | `vibescan`, `secure` (same `dist/system/cli/index.js`) |
| **Language / runtime** | TypeScript → JavaScript, **Node 18+** |
| **Repo** | [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner) |
| **Workspaces** | Root scanner + [`packages/secure-arch-*`](../packages/) (`npm` workspaces; see root `package.json`) |

---

## What it does

Static analysis for **JavaScript/TypeScript** focused on:

- **Cryptographic failures** (OWASP **A02:2021**-style patterns)
- **Injection** and related issues (**A03:2021**-style patterns)

Mechanisms:

1. **AST pattern rules** — Acorn → ESTree; rules subscribe to `nodeTypes` and run in [`ruleEngine`](../src/system/engine/ruleEngine.ts).
2. **Taint engine** — Tracks untrusted sources (e.g. `req.body`) to sinks (SQL, `exec`, paths, XSS, logs, SSRF-ish HTTP, …) in [`taintEngine.ts`](../src/system/engine/taintEngine.ts).
3. **Express route graph** — [`routeGraph.ts`](../src/system/parser/routeGraph.ts) for middleware audit.
4. **Optional** — `--check-registry` → **SLOP-001** ([`slopsquat.ts`](../src/system/ai/slopsquat.ts)); `--generate-tests` → [`testWriter.ts`](../src/system/engine/testWriter.ts); `--mode ai` → [`ai-analyzer.ts`](../src/system/ai/ai-analyzer.ts).

**Path note:** Some task specs refer to `src/rules/system/ai/`. In this repo, that logic lives under **`src/system/ai/`**; pattern rules live under **`src/attacks/`**.

### Universal secure-architecture layer

- **Settings in YAML** under [`architecture/secure-rules/`](../architecture/secure-rules/) (AI tools fill templates; they do not “validate” security by themselves).
- **Static checker** — [`@secure-arch/core`](../packages/secure-arch-core/) loads YAML, runs **ARCH-*** rules, and optionally correlates **JS/TS** evidence via **`secure-code-scanner`** (`ARCH-E*`) plus **Python/Java** heuristics (`ARCH-H*`).
- **CLI** — [`secure-arch`](../packages/secure-arch-cli/src/cli.ts): `install`, `init --tool cursor|amazonq`, `check`.
- **Docs** — [docs/secure-arch/README.md](secure-arch/README.md).

---

## End-to-end pipeline

```
CLI (cli/index.ts)
  → glob **/*.{js,ts,mjs,cjs}
  → scanProjectAsync(scanner.ts)
       → per file: parseFile → runRuleEngine → runTaintEngine → routeGraph → appLevelAudit
       → merge routes → runMiddlewareAudit
       → [optional] checkDependencies (SLOP-001)
       → [optional] generateTests
  → format (human | compact | json)
```

Exit **non-zero** if any finding has severity **critical** or **error** (see [`cli/index.ts`](../src/system/cli/index.ts)).

**Parent pointers:** [`buildParentMap`](../src/system/walker.ts) is built once per file AST and passed into `RuleContext.getParent` for rules that need ancestors (e.g. **SSRF-003**). The ESLint wrapper builds the same map from `context.getSourceCode().ast` ([`eslint-plugin.ts`](../src/system/eslint-plugin.ts)).

---

## Implemented features (checklist alignment)

| Feature | Location |
|---------|----------|
| Crypto rules (hash, cipher, IV, random, secrets, JWT, TLS) | [`src/attacks/crypto/`](../src/attacks/crypto/) |
| Injection rules (SQL, command, path, XSS, NoSQL, XPath, log, eval) | [`src/attacks/injection/`](../src/attacks/injection/), [`src/attacks/browser/`](../src/attacks/browser/), [`src/attacks/file/`](../src/attacks/file/) |
| **SEC-004** — weak `process.env \|\| 'weakLiteral'` | [`default-secret-fallback.ts`](../src/attacks/crypto/default-secret-fallback.ts) + [`secretDict.ts`](../src/attacks/crypto/secretDict.ts) |
| Tiered weak secrets + `isLikelyRealSecret` (entropy + provider regexes) | [`secretDict.ts`](../src/attacks/crypto/secretDict.ts) re-exports from [`entropy.ts`](../src/attacks/crypto/entropy.ts) |
| **SLOP-001** — npm HEAD, max 5 concurrent, workspaces by package name, `.npmrc` non-npmjs skip | [`slopsquat.ts`](../src/system/ai/slopsquat.ts) |
| **SSRF-003** — `ip.isPublic`/`isPrivate` when gating `fetch`/HTTP client on same URL id | [`ipGuard.ts`](../src/system/ai/ipGuard.ts) |
| **RULE-SSRF-002** — axios baseURL + user URL | [`axiosBypass.ts`](../src/system/ai/axiosBypass.ts) |
| Prototype pollution payloads | [`prototypePollution.ts`](../src/attacks/injection/prototypePollution.ts) |
| `envFallback` shim (re-export) | [`envFallback.ts`](../src/system/ai/envFallback.ts) |
| Rule registry | [`attacks/index.ts`](../src/attacks/index.ts) — `cryptoRules` (9), `injectionRules` (11) |

**Finding extras:** `packageName`, `cveRef`, `findingKind`, `remediation` on [`Finding`](../src/system/types.ts) where relevant.

---

## File structure

```
CyberSecurity/
├── docs/
│   ├── REPO-HANDOFF.md          ← this file
│   ├── secure-arch/             ← secure-arch usage + AI prompts
│   ├── research-strengthening/  ← paper/poster methodology hub
│   └── vibescan/                ← poster HTML, abstract, pitch, QR, checklist
├── architecture/secure-rules/   ← YAML settings (after secure-arch install)
├── packages/
│   ├── secure-arch-core/
│   ├── secure-arch-cli/
│   └── secure-arch-adapters/
├── benchmarks/                  ← DVNA README + seeded corpora + scripts + dated run outputs
├── results/                     ← DVNA benchmark outputs + evaluation markdown (legacy; see benchmarks/results/archive)
├── src/
│   ├── attacks/
│   │   ├── index.ts             # cryptoRules[], injectionRules[]
│   │   ├── crypto/              # SEC-004, JWT, secretDict, entropy, ciphers, …
│   │   ├── injection/           # SQL, command, proto payloads, …
│   │   ├── browser/             # XSS
│   │   └── file/                # Path traversal
│   └── system/
│       ├── scanner.ts           # scan, scanProject, scanProjectAsync
│       ├── cli/index.ts
│       ├── types.ts
│       ├── format.ts
│       ├── walker.ts            # walk, buildParentMap
│       ├── parser/              # parseFile.ts, routeGraph.ts
│       ├── engine/              # ruleEngine, taintEngine, audits, testWriter
│       ├── sources/             # taint sources
│       ├── sinks/               # taint sinks
│       ├── sanitizers/
│       ├── utils/               # rule-types, helpers, …
│       ├── ai/                  # slopsquat, ipGuard, axiosBypass, envFallback, ai-analyzer
│       ├── eslint-plugin.ts
│       └── index.ts
├── tests/
│   ├── helpers.mjs
│   ├── fixtures/
│   └── unit/*.test.mjs          # node:test (51 tests)
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore                   # includes dvna/, dist/, node_modules/
```

**Build:** `npm run build` → **`dist/`** (often gitignored; publish uses `files: ["dist", "README.md"]`).

**Local DVNA:** Clone to `./dvna` for benchmarks; folder is **gitignored** by default.

---

## Commands

```bash
npm install
npm run build              # tsc (scanner at repo root)
npm run build:arch         # build secure-arch workspaces
npm run test               # build + node --test tests/unit/  (~51 tests)
npm run test:arch          # secure-arch-core tests
npm run test:only          # tests only, dist must exist

# Scan application code only (avoid node_modules):
npx vibescan scan src
# or
node dist/system/cli/index.js scan src --format compact

# Optional architecture rulepack + checks:
npx secure-arch install --root .
npx secure-arch check --root . --code-evidence js-ts
```

---

## Research artifacts

| Path | Purpose |
|------|---------|
| [`results/dvna-evaluation.md`](../results/dvna-evaluation.md) | Tool comparison vs DVNA themes + preliminary evaluation paragraph |
| [`results/person-b-handoff.md`](../results/person-b-handoff.md) | Secret-dict stats, rule counts for poster |
| [`results/eslint-dvna.eslintrc.cjs`](../results/eslint-dvna.eslintrc.cjs) | eslint-plugin-security config for DVNA runs |
| Raw logs | `vibescan-dvna.txt`, `eslint-dvna.txt`, `npm-audit-dvna.txt`, `bearer-dvna.txt` |

---

## Maintenance

- **Rule IDs / CWE table:** Keep [`README.md`](../README.md) in sync when adding rules.
- **New AST rule:** Add `Rule` in `src/attacks/...`, export from [`attacks/index.ts`](../src/attacks/index.ts), add `tests/unit/*.test.mjs` using [`tests/helpers.mjs`](../tests/helpers.mjs).

---

*Last updated to match repo layout and README as of the VibeScan Person A implementation pass.*
