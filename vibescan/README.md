# VibeScan

VibeScan is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP A02:2021) and **injection** issues (A03:2021), with optional npm **registry checks** (SLOP-001) and optional **generated tests**.

Published npm package: `vibescan`  
CLI binaries: `vibescan` and `secure`

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

## CI-friendly output

Write machine-readable output to a file:

```bash
npx vibescan scan . --format json  > vibescan.json
npx vibescan scan . --format sarif > vibescan.sarif
```

Exit code is **non-zero** if any finding has severity `critical` or `error`.

## GitHub Actions

There is **no** separate marketplace GitHub Action for VibeScan yet. Use Node and install the **`vibescan`** npm package (global install or **`npx`**) in your workflow.

**Example workflow** (scan the repo, write SARIF, optional upload to GitHub code scanning):

```yaml
name: VibeScan

on:
  push:
    branches: [main]
  pull_request:

jobs:
  vibescan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g vibescan
      - run: vibescan scan . --exclude-vendor --format sarif > vibescan.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: success() || failure()
        with:
          sarif_file: vibescan.sarif
```

Pin the CLI version with **`npx`** instead of a global install:

```yaml
      - run: npx --yes vibescan@1.0.0 scan . --exclude-vendor --format sarif > vibescan.sarif
```

**SARIF upload:** `security-events: write` is required for **`github/codeql-action/upload-sarif`**. On private repositories, your org must allow GitHub code scanning (policy and billing may apply). If you only need the artifact in CI, drop the upload step and add **`actions/upload-artifact`** on **`vibescan.sarif`** instead.

## Options (high level)

- `--rules crypto,injection`
- `--severity critical|error|warning|info`
- `--exclude-vendor`
- `--check-registry` (optional SLOP-001 signal)

## Developing in this monorepo

If you cloned **[cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner)** (the full repo), build and test from the **workspace root**:

```bash
npm install
npm run build   # builds the vibescan workspace
npm test        # runs vibescan unit tests
```

Scanner source lives under **`vibescan/src/`**; build output is **`vibescan/dist/`** only. See **[`docs/MONOREPO-LAYOUT.md`](../docs/MONOREPO-LAYOUT.md)** for what ships on npm vs stays workspace-only.

## Limitations (LLM and beyond)

VibeScan does **not** execute prompts against your model or audit training data. It cannot measure jailbreak success, data poisoning, or model inversion. For dependency risks, use **`npm audit`** and pinning alongside optional **`--check-registry`** (`SLOP-001`). A fuller mapping of LLM-related threat categories to this tool vs other controls is in the monorepo doc **[`docs/vibescan/llm-threat-coverage.md`](../docs/vibescan/llm-threat-coverage.md)** (published npm package README cannot link to all monorepo paths on npmjs.com—clone the repo for that file).

