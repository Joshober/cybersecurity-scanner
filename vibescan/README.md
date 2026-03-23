# VibeScan

Static security scanner for Express-style Node.js apps: **route graph extraction** (Babel), **rule pack** (injection, auth, middleware, secrets, prototype pollution), optional **npm registry** checks (“slopsquat”), and **Jest test stubs** generation.

## Install

From this directory:

```bash
npm install
```

Global / local CLI via `bin`:

```bash
node src/cli.js scan ./src
npx vibescan scan ./src
```

## Usage

```bash
vibescan scan <dir>              # human-readable report
vibescan scan <dir> --json       # CI-friendly JSON
vibescan scan <dir> --generate-tests --tests-dir ./generated
vibescan scan <dir> --check-registry --package-json ./package.json
vibescan scan <dir> --check-registry --skip-registry   # offline: skip HEAD requests
vibescan rules                   # list rules (id, severity, CWE, OWASP)
```

Exit code **1** if any **critical** severity finding is present (for CI gating).

## Generated tests

`--generate-tests` writes Jest files with a **TODO import** for your real Express app. Wire `import app from '…'` and helpers (`supertest`, tokens) before relying on them in CI. See comments in [src/generator/testWriter.js](src/generator/testWriter.js).

## Layout

- [src/extractor/](src/extractor/) — `extractRoutes(dir)`, route objects (`fullPath`, middleware chain, `req.*` fields)
- [src/rules/](src/rules/) — rule registry [src/rules/index.js](src/rules/index.js)
- [src/payloads/](src/payloads/) — payload lists for docs / future DAST
- [src/secrets/](src/secrets/) — weak-secret dictionaries + entropy helper
- [src/slopsquat/](src/slopsquat/) — `checkDependencies(packageJsonPath)`
- [src/reporter/](src/reporter/) — chalk table + JSON
- [tests/fixtures/](tests/fixtures/) — sample apps

Full rule descriptions: [RULES.md](RULES.md). Contributing new rules: [CONTRIBUTING.md](CONTRIBUTING.md).

## Tests

```bash
npm test
```

Benchmark-style fixture sweep:

```bash
node tests/benchmark.js
```

## Limitations

Heuristic static analysis: false positives and false negatives are expected. Dynamic routes, unusual framework wrappers, and indirection through helpers are only partially supported.
