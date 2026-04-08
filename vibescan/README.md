# VibeScan

[![npm version](https://img.shields.io/npm/v/@jobersteadt/vibescan)](https://www.npmjs.com/package/@jobersteadt/vibescan)
[![license](https://img.shields.io/npm/l/@jobersteadt/vibescan)](./LICENSE)

Developer-first JavaScript and TypeScript security scanning for Node projects.

`@jobersteadt/vibescan` provides:
- Static analysis for injection and crypto risk patterns
- Project-aware JSON and SARIF output for CI/CD
- Local proof-oriented test generation for supported findings
- `secure-arch` policy checks in the same CLI
- AI governance export for Cursor and Amazon Q

Official CLI command: `vibescan`.
The `secure` binary is a backward-compatible alias.

## Install

Use one of these patterns.

```bash
# one-off run
npx --yes @jobersteadt/vibescan@latest scan . --exclude-vendor

# project install (recommended)
npm i -D @jobersteadt/vibescan
```

Add scripts in your `package.json`:

```json
{
  "scripts": {
    "security:scan": "vibescan scan . --exclude-vendor",
    "security:json": "vibescan scan . --exclude-vendor --format json",
    "security:sarif": "vibescan scan . --exclude-vendor --format sarif"
  }
}
```

## Quick Start

```bash
# default scan
vibescan scan .

# strict CI-style scan
vibescan scan . --exclude-vendor --severity error

# machine-readable output
vibescan scan . --exclude-vendor --format json > vibescan.json
vibescan scan . --exclude-vendor --format sarif > vibescan.sarif
```

Exit code is non-zero when findings at `error` or `critical` are present.

## Commands

| Command | Purpose |
|---|---|
| `vibescan scan [paths...]` | Run the static scanner. |
| `vibescan report <results.json>` | Generate a static HTML report from prior JSON output. |
| `vibescan prove [paths...] [--output dir]` | Generate local proof-oriented tests for supported findings. |
| `vibescan prove --run --from <project.json>` | Execute previously generated proof tests and write proof run log. |
| `vibescan reproduce <findingId> --from <project.json>` | Run one generated proof test by finding id. |
| `vibescan import-sarif <file.sarif> ...` | Normalize or merge external SARIF into VibeScan output. |
| `vibescan comparison-report ...` | Generate benchmark comparison markdown. |
| `vibescan export-ai-rules ...` | Export AI governance artifacts (Cursor/Amazon Q/markdown/policy). |
| `vibescan secure-arch ...` | Run secure-arch install/init/check flows. |
| `vibescan init` | Bootstrap config/workflow files in a project. |

## Common Options

| Option | Description |
|---|---|
| `--format human|compact|json|sarif` | Output format. |
| `--severity critical|error|warning|info` | Minimum severity to show. |
| `--exclude-vendor` | Skip vendor-like paths (`node_modules`, `dist`, minified bundles). |
| `--ignore-glob <pattern>` | Add custom ignore globs (repeatable). |
| `--mode static|ai` | Static scan or static scan plus IDE assist markdown output. |
| `--check-registry` | Enable slopsquat-style npm registry signal (`SLOP-001`). |
| `--openapi-spec <file>` | Add one or more OpenAPI specs for drift checks. |
| `--no-openapi-discovery` | Disable spec auto-discovery. |
| `--html [--html-out <path>]` | Write static HTML report alongside scan output. |

## TypeScript Semantic Analysis

VibeScan supports two TypeScript paths:
- Syntax-aware TypeScript parsing for `.ts` and `.tsx`
- Optional semantic analysis with `tsconfig` and type checker

```bash
vibescan scan . --ts-analysis auto
vibescan scan . --ts-analysis semantic --tsconfig ./tsconfig.json
```

Modes:
- `off`: syntax-only
- `auto`: semantic when setup succeeds, otherwise fallback with warning
- `semantic`: semantic required (unless `--ts-fail-open` is set)

## Config File

Create `vibescan.config.json` in your project root (or copy `vibescan.config.sample.json`).

Example:

```json
{
  "rules": {
    "crypto": true,
    "injection": true
  },
  "severityThreshold": "warning",
  "excludeVendor": true,
  "ignore": ["**/generated/**"],
  "format": "compact",
  "openApiDiscovery": true,
  "tsAnalysis": "auto",
  "tsconfigPath": "tsconfig.json",
  "tsFailOpen": true,
  "baseline": ".vibescan/baseline.json"
}
```

## Baseline Workflow for CI Adoption

Use a baseline when introducing VibeScan to an existing codebase.

```bash
# 1) capture baseline
vibescan scan . --exclude-vendor --write-baseline .vibescan/baseline.json

# 2) enforce only new findings in CI
vibescan scan . --exclude-vendor --baseline .vibescan/baseline.json
```

Use `--baseline-include-known` when you want deferred findings printed in human output.

## Proof-Oriented Test Generation

Generate deterministic local test files for supported finding families:

```bash
vibescan prove . --output ./vibescan-generated-tests
node --test ./vibescan-generated-tests
```

Run proofs from a prior project JSON:

```bash
vibescan prove --run --from ./vibescan.json --output ./proof-run-log.json
```

Notes:
- Proof generation is not universal for every rule.
- Unsupported findings are marked in output metadata.

## Secure Architecture Commands

`secure-arch` is bundled behind the same CLI:

```bash
vibescan secure-arch install --root .
vibescan secure-arch init --tool cursor --root .
vibescan secure-arch check --root . --code-evidence js-ts --format human
```

Default secure-arch settings location is `vibescan/architecture/secure-rules` under project root.

## AI Governance Export

Generate policy/governance artifacts for coding assistants:

```bash
vibescan export-ai-rules --root .
# optional:
# --emit all|cursor,amazonq,markdown,policy
# --settings <relative/settings/path>
```

Outputs can include:
- `.cursor/rules/secure-arch-settings.mdc`
- `vibescan-ai-governance.md`
- `vibescan.policy.json`
- optional static scan rule hints from `vibescan.config.json`

## CI Example (GitHub Actions)

Template file in this package:
- `templates/github-actions.yml`

Minimal example step:

```yaml
- name: VibeScan
  run: npx --yes @jobersteadt/vibescan@latest scan . --exclude-vendor --format sarif > vibescan.sarif
```

For reproducible builds, pin a package version instead of `latest`.

## Programmatic Usage

```js
import { scan, scanProjectAsync } from "@jobersteadt/vibescan";

const result = scan("const x = eval(userInput)", "app.js");
console.log(result.findings);

const project = await scanProjectAsync([
  { path: "app.js", source: "const x = eval(req.query.q)" }
]);
console.log(project.findings.length);
```

## Publishing and Release Checks

From `vibescan/`:

```bash
npm run release:check
npm run release:quick
```

Quick tarball inspection:

```bash
npm pack --dry-run
```

## Monorepo Notes

In the `CyberSecurity` monorepo checkout:
- Package sources are in `vibescan/`
- secure-arch workspace packages are under `vibescan/packages/`
- architecture policy examples are in `vibescan/architecture/`
- additional docs are in `docs/vibescan/`

## License

MIT. See [LICENSE](./LICENSE).
