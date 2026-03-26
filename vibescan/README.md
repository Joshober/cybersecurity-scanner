# VibeScan

VibeScan is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP A02:2021) and **injection** issues (A03:2021), with optional npm **registry checks** (SLOP-001) and optional **generated tests**.

Published npm package: `vibescan`  
CLI binaries: `vibescan` and `secure` (alias; same dispatcher)

## Install

```bash
npm i vibescan
```

## Quick start

```bash
npx vibescan scan .
# or:
npx secure scan .
```

## secure-arch (portable architecture checks + AI instruction helpers)
This repo also ships `secure-arch` as a portable rule-pack. It is vendored into the published `vibescan` package, so consumers get these commands from the same npm install.

Install the YAML rule pack into your project:
```bash
npx vibescan secure-arch install --root .
```

Generate AI tool instruction files (Cursor/Amazon Q):
```bash
npx vibescan secure-arch init --tool cursor
npx vibescan secure-arch init --tool amazonq
```

Alias for the init flow:
```bash
npx vibescan export-ai-rules --tool cursor
```

Optional alias (same as `secure-arch init`):
```bash
npx vibescan init --tool cursor
```

Run the static secure-architecture checks against your project’s YAML settings:
```bash
npx vibescan secure-arch check --root . --code-evidence off --format human
```

All of the above also works with the `secure` alias, e.g. `npx secure secure-arch check ...`.

## CI-friendly output

Write machine-readable output to a file:

```bash
npx vibescan scan . --format json  > vibescan.json
npx vibescan scan . --format sarif > vibescan.sarif
```

Exit code is **non-zero** if any finding has severity `critical` or `error`.

## Options (high level)

- `--rules crypto,injection`
- `--severity critical|error|warning|info`
- `--exclude-vendor`
- `--check-registry` (optional SLOP-001 signal)

## Publish verification
From the `vibescan/` directory, run:
```bash
npm pack --dry-run
```
Then confirm the tarball includes the vendored secure-arch runtime assets under:
- `dist/node_modules/@secure-arch/core/templates/*`
- `dist/node_modules/@secure-arch/core/schema/*`
- `dist/node_modules/@secure-arch/core/dist/*`
- `dist/node_modules/@secure-arch/adapters/dist/*`
- `dist/node_modules/@secure-arch/cli/dist/*`

