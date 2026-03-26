# VibeScan

VibeScan is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP A02:2021) and **injection** issues (A03:2021), with optional npm **registry checks** (SLOP-001) and optional **generated tests**.

Same CLI under two scoped names on **two registries** (npm scope vs GitHub scope differ):

| Registry | Package name | Notes |
|----------|----------------|--------|
| **registry.npmjs.org** | **`@jobersteadt/vibescan`** | [npm link](https://www.npmjs.com/package/@jobersteadt/vibescan) — this is what **`npm install`** uses today. |
| **GitHub Packages** | **`@joshober/vibescan`** | Matches GitHub user [Joshober](https://github.com/Joshober); needs `.npmrc` + token (below). |

CLI binaries (after install): **`vibescan`** and **`secure`** (same for either package name).

**Why two names?** GitHub Packages requires the scope to be a **real GitHub** owner (`@joshober`). Public **npmjs** publishing used your **npm** account scope (`@jobersteadt`). The repo’s `package.json` is **`@joshober/vibescan`** so GitHub publishes work; **`@joshober/vibescan` is not on npmjs yet** until you publish that scope to npm (npm user/org must own `@joshober` on npm).

## Install

**From npm (registry.npmjs.org)** — no extra config (use this in projects like `fashion_ai`):

```bash
npm i @jobersteadt/vibescan
# pin version:
npm i @jobersteadt/vibescan@1.0.1
```

**From GitHub Packages** — point the scope at GitHub’s npm registry, then install:

```bash
npm i @joshober/vibescan
```

In the project (or your global `~/.npmrc`), add:

```ini
@joshober:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then set a token with **`read:packages`** (fine-grained PAT or classic PAT) and run:

```bash
export NODE_AUTH_TOKEN=ghp_xxx   # PowerShell: $env:NODE_AUTH_TOKEN = "ghp_xxx"
npm i @joshober/vibescan@1.0.1
```

Public packages on GitHub still require authentication for **`npm install`** against `npm.pkg.github.com` in most setups; use a PAT or **`GITHUB_TOKEN`** in Actions (see GitHub Actions example below).

## Quick start

```bash
# from npmjs (no @joshober on npm yet):
npx @jobersteadt/vibescan scan .

# after any install, local bin names are the same:
npx vibescan scan .
# or:
npx secure scan .
```

## CI-friendly output

Write machine-readable output to a file:

```bash
npx @jobersteadt/vibescan scan . --format json  > vibescan.json
npx @jobersteadt/vibescan scan . --format sarif > vibescan.sarif
```

Exit code is **non-zero** if any finding has severity `critical` or `error`.

## GitHub Actions

There is **no** separate marketplace GitHub Action for VibeScan yet. Use Node and install **`@jobersteadt/vibescan`** from npm, or **`@joshober/vibescan`** from GitHub Packages.

**Example A — install from npm (registry.npmjs.org)** — simplest for public repos:

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
      - run: npm install -g @jobersteadt/vibescan
      - run: vibescan scan . --exclude-vendor --format sarif > vibescan.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: success() || failure()
        with:
          sarif_file: vibescan.sarif
```

**Example B — install from GitHub Packages** (`npm.pkg.github.com`) in the same org/user:

```yaml
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://npm.pkg.github.com
          scope: '@joshober'
      - run: npm install -g @joshober/vibescan
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: vibescan scan . --exclude-vendor --format sarif > vibescan.sarif
```

Pin with **`npx`** from **npm** (use **`@jobersteadt`** until **`@joshober`** is published to npmjs):

```yaml
      - run: npx --yes @jobersteadt/vibescan@1.0.1 scan . --exclude-vendor --format sarif > vibescan.sarif
```

**SARIF upload:** `security-events: write` is required for **`github/codeql-action/upload-sarif`**. On private repositories, your org must allow GitHub code scanning (policy and billing may apply). If you only need the artifact in CI, drop the upload step and add **`actions/upload-artifact`** on **`vibescan.sarif`** instead.

## Options (high level)

- `--rules crypto,injection`
- `--severity critical|error|warning|info`
- `--exclude-vendor`
- `--check-registry` (optional SLOP-001 signal)

## Limitations (LLM and beyond)

VibeScan does **not** execute prompts against your model or audit training data. It cannot measure jailbreak success, data poisoning, or model inversion. For dependency risks, use **`npm audit`** and pinning alongside optional **`--check-registry`** (`SLOP-001`). For broader context, see the repository documentation: https://github.com/Joshober/cybersecurity-scanner

## Development (optional)

This package is built from the `vibescan/` workspace in the monorepo. For issues, contribution guidance, and additional artifacts, see: https://github.com/Joshober/cybersecurity-scanner
