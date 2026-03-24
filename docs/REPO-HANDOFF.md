# VibeScan repository handoff (for collaborators / LLMs)

This document summarizes **what the repo is**, **how the scanner works**, **what is implemented**, and **where files live**. Paste or attach it when onboarding a new assistant.

**Related:** [README.md](../README.md) (install, CLI, rule×CWE table) · [**Monorepo / package layout**](MONOREPO-LAYOUT.md) (what is published vs workspace-only) · [docs/research-strengthening/](research-strengthening/) (RQ, methodology, evaluation plan, metrics, merge strategy) · [docs/secure-arch/](secure-arch/) (universal architecture rule pack + `secure-arch` CLI) · [docs/vibescan/](vibescan/) (poster, abstract, pitch, checklist) · [benchmarks/results/legacy/](../benchmarks/results/legacy/) (DVNA evaluation markdown + raw logs).

---

## Monorepo layout (settled)

The scanner **does not** live at the repository root. **Root** `package.json` is **`private: true`** and only orchestrates workspaces. The **publishable** scanner is the **`vibescan/`** workspace (`npm publish -w vibescan`); source and build output are **`vibescan/src/`** and **`vibescan/dist/`**. Full detail: [`docs/MONOREPO-LAYOUT.md`](MONOREPO-LAYOUT.md).

---

## Product identity

| Item | Value |
|------|--------|
| **Product name** | VibeScan |
| **npm package** | `vibescan` (published from [`vibescan/`](../vibescan/); scanner `src/` lives under `vibescan/`) |
| **CLI binaries** | `vibescan`, `secure` (same `vibescan/dist/system/cli/index.js`) |
| **Language / runtime** | TypeScript → JavaScript, **Node 18+** |
| **Repo** | [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner) |
| **Workspaces** | Private root + [`vibescan/`](../vibescan/) + [`packages/secure-arch-*`](../packages/) (`npm` workspaces; see root `package.json`) |

---

## Repository roles

- **Evaluated artifact (paper):** VibeScan — the **`vibescan`** npm package (`vibescan/src/`, CLI `vibescan` / `secure`), with evidence in `benchmarks/results/`.
- **Supporting product layer:** `secure-arch` (YAML policy + `secure-arch check`) under `packages/secure-arch-*` and `docs/secure-arch/` — use for policy/evidence, but treat as out-of-scope for benchmark numbers unless explicitly evaluated.
- **Research / conference layer:** `docs/vibescan/`, `benchmarks/`, `demo/` — same git repo as the product; not shipped in the `vibescan` npm tarball (`files`: `dist`, `README.md` only).

## Maturity legend (how to avoid “scope mixing”)

- **Implemented:** shipped in the default CLI/scanner path.
- **Documented:** described in README/handoff materials.
- **Evaluated:** covered by manifest + adjudication + frozen benchmark outputs.
- **Future:** explicitly planned, not part of current evidence.

---

## What it does

Static analysis for **JavaScript/TypeScript** focused on:

- **Cryptographic failures** (OWASP **A02:2021**-style patterns)
- **Injection** and related issues (**A03:2021**-style patterns)

Mechanisms:

1. **AST pattern rules** — Acorn → ESTree; rules subscribe to `nodeTypes` and run in [`ruleEngine`](../vibescan/src/system/engine/ruleEngine.ts).
2. **Taint engine** — Tracks untrusted sources (e.g. `req.body`) to sinks (SQL, `exec`, paths, XSS, logs, SSRF-ish HTTP, …) in [`taintEngine.ts`](../vibescan/src/system/engine/taintEngine.ts).
3. **Express route graph** — [`routeGraph.ts`](../vibescan/src/system/parser/routeGraph.ts) for middleware audit.
4. **Optional** — `--check-registry` → **SLOP-001** ([`slopsquat.ts`](../vibescan/src/system/ai/slopsquat.ts)); `--generate-tests` → [`testWriter.ts`](../vibescan/src/system/engine/testWriter.ts); `--mode ai` → [`ai-analyzer.ts`](../vibescan/src/system/ai/ai-analyzer.ts).

**Path note:** Some task specs refer to `src/rules/system/ai/`. In this repo, that logic lives under **`vibescan/src/system/ai/`**; pattern rules live under **`vibescan/src/attacks/`**.

### Universal secure-architecture layer

- **Settings in YAML** under [`architecture/secure-rules/`](../architecture/secure-rules/) (AI tools fill templates; they do not “validate” security by themselves).
- **Static checker** — [`@secure-arch/core`](../packages/secure-arch-core/) loads YAML, runs **ARCH-*** rules, and optionally correlates **JS/TS** evidence via **`vibescan`** (`ARCH-E*`) plus **Python/Java** heuristics (`ARCH-H*`).
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

Exit **non-zero** if any finding has severity **critical** or **error** (see [`cli/index.ts`](../vibescan/src/system/cli/index.ts)).

**Parent pointers:** [`buildParentMap`](../vibescan/src/system/walker.ts) is built once per file AST and passed into `RuleContext.getParent` for rules that need ancestors (e.g. **SSRF-003**). The ESLint wrapper builds the same map from `context.getSourceCode().ast` ([`eslint-plugin.ts`](../vibescan/src/system/eslint-plugin.ts)).

---

## Implemented features (checklist alignment)

| Feature | Location |
|---------|----------|
| Crypto rules (hash, cipher, IV, random, secrets, JWT, TLS) | [`vibescan/src/attacks/crypto/`](../vibescan/src/attacks/crypto/) |
| Injection rules (SQL, command, path, XSS, NoSQL, XPath, log, eval) | [`vibescan/src/attacks/injection/`](../vibescan/src/attacks/injection/), [`vibescan/src/attacks/browser/`](../vibescan/src/attacks/browser/), [`vibescan/src/attacks/file/`](../vibescan/src/attacks/file/) |
| **SEC-004** — weak `process.env \|\| 'weakLiteral'` | [`default-secret-fallback.ts`](../vibescan/src/attacks/crypto/default-secret-fallback.ts) + [`secretDict.ts`](../vibescan/src/attacks/crypto/secretDict.ts) |
| Tiered weak secrets + `isLikelyRealSecret` (entropy + provider regexes) | [`secretDict.ts`](../vibescan/src/attacks/crypto/secretDict.ts) re-exports from [`entropy.ts`](../vibescan/src/attacks/crypto/entropy.ts) |
| **SLOP-001** — npm HEAD, max 5 concurrent, workspaces by package name, `.npmrc` non-npmjs skip | [`slopsquat.ts`](../vibescan/src/system/ai/slopsquat.ts) |
| **SSRF-003** — `ip.isPublic`/`isPrivate` when gating `fetch`/HTTP client on same URL id | [`ipGuard.ts`](../vibescan/src/system/ai/ipGuard.ts) |
| **RULE-SSRF-002** — axios baseURL + user URL | [`axiosBypass.ts`](../vibescan/src/system/ai/axiosBypass.ts) |
| `envFallback` shim (re-export) | [`envFallback.ts`](../vibescan/src/system/ai/envFallback.ts) |
| Rule registry | [`attacks/index.ts`](../vibescan/src/attacks/index.ts) — `cryptoRules` (10), `injectionRules` (12) |

## Additional notes

- **`prototypePollution.ts`** — registered as **`RULE-PROTO-001`** in the default injection rule list.
- **`jwt-weak-test.ts`** — exposes **`crypto.jwt.weak-secret-verify`** in the default crypto rule list (alongside the existing JWT sign rule).
- **`entropy.ts`** — helper for secret detection; not a standalone rule.

**Finding extras:** `packageName`, `cveRef`, `findingKind`, `remediation` on [`Finding`](../vibescan/src/system/types.ts) where relevant.

---

## File structure

```
CyberSecurity/                    ← private workspace root (not published)
├── docs/
│   ├── MONOREPO-LAYOUT.md       ← published vs workspace-only (authoritative)
│   ├── REPO-HANDOFF.md          ← this file
│   ├── samples/                 ← example policy JSON for policy-eval bridge
│   ├── secure-arch/             ← secure-arch usage + AI prompts
│   ├── research-strengthening/  ← paper/poster methodology hub
│   └── vibescan/                ← poster HTML, abstract, pitch, QR, checklist
├── vibescan/                    ← published npm package `vibescan` (scanner src + tests + dist)
│   ├── src/                     # attacks/, system/ (CLI, engine, rules)
│   ├── tests/
│   ├── scripts/                 # policy-eval.mjs, …
│   ├── package.json
│   └── tsconfig.json
├── demo/                        ← conference / interactive demo (not in npm tarball)
├── architecture/secure-rules/   ← YAML settings (default for secure-arch install)
├── packages/
│   ├── secure-arch-core/
│   ├── secure-arch-cli/
│   └── secure-arch-adapters/
├── benchmarks/
│   ├── dvna/                    ← clone instructions; clone lives in benchmarks/dvna/dvna/ (gitignored)
│   ├── vuln-lab/                ← curated vulnerable Express benchmark (committable; see GROUND_TRUTH.md)
│   ├── seeded/                  ← tiny committable snippets
│   ├── scripts/                 ← repro runners
│   └── results/                 ← dated runs + legacy/ (DVNA prose + raw tool logs)
├── package.json                 # workspaces only (private)
├── package-lock.json
├── README.md
└── .gitignore                   # dvna/, benchmarks/dvna/dvna/, dist/, node_modules/, …
```

**Build:** `npm run build -w vibescan` (or `npm run build` at root) → **`vibescan/dist/`** (gitignored; publish uses `files: ["dist", "README.md"]` inside `vibescan/`).

**Local DVNA:** Prefer `benchmarks/dvna/dvna` (see [`benchmarks/dvna/README.md`](../benchmarks/dvna/README.md)); legacy `./dvna` at repo root is still supported and **gitignored**.

---

## Commands

```bash
npm install
npm run build -w vibescan # tsc (scanner under vibescan/)
npm run build:arch         # build secure-arch workspaces
npm run test -w vibescan   # build + node --test vibescan/tests/unit/ (~51 tests)
npm run test:arch          # secure-arch-core tests

# Scan application code only (avoid node_modules):
npx vibescan scan vibescan/src
# or
node vibescan/dist/system/cli/index.js scan vibescan/src --format compact

# Optional architecture rulepack + checks:
npx secure-arch install --root .
npx secure-arch check --root . --code-evidence js-ts
```

---

## Research artifacts

| Path | Purpose |
|------|---------|
| [`benchmarks/results/legacy/dvna-evaluation.md`](../benchmarks/results/legacy/dvna-evaluation.md) | Tool comparison vs DVNA themes + preliminary evaluation paragraph |
| [`benchmarks/results/legacy/person-b-handoff.md`](../benchmarks/results/legacy/person-b-handoff.md) | Secret-dict stats, rule counts for poster |
| [`benchmarks/results/legacy/eslint-dvna.eslintrc.cjs`](../benchmarks/results/legacy/eslint-dvna.eslintrc.cjs) | eslint-plugin-security config for DVNA runs |
| Raw logs | Same folder: `vibescan-dvna.txt`, `eslint-dvna.txt`, `npm-audit-dvna.txt`, `bearer-dvna.txt` |

---

## Maintenance

- **Rule IDs / CWE table:** Keep [`README.md`](../README.md) in sync when adding rules.
- **New AST rule:** Add `Rule` in `vibescan/src/attacks/...`, export from [`attacks/index.ts`](../vibescan/src/attacks/index.ts), add `vibescan/tests/unit/*.test.mjs` using [`vibescan/tests/helpers.mjs`](../vibescan/tests/helpers.mjs).

---

*Last updated to match monorepo layout: private root workspace, publishable scanner under `vibescan/`.*


