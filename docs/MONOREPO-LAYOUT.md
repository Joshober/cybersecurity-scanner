# Monorepo and package layout (current)

This document is the **authoritative** description of how this repository is structured. It supersedes older notes that described a “mid-migration” or “root scanner package.”

## Summary

| Layer | Role | Published to npm? |
|-------|------|-------------------|
| **Repository root** (`package.json` → `cybersecurity-scanner-monorepo`) | Private **workspace orchestrator** — installs deps, runs workspace scripts, holds research/benchmark/demo/docs | **No** (`"private": true`) |
| **[`vibescan/`](../vibescan/)** | The **VibeScan** scanner — `src/`, `tests/`, `tsconfig`, build output **`vibescan/dist/`** | **Yes** — package name **`vibescan`** |
| **`packages/secure-arch-*`** | Architecture settings, checks, CLI, adapters | **Yes** (scoped `@secure-arch/*` where applicable) |
| **`benchmarks/`**, **`demo/`**, **`docs/`**, **`architecture/`** | Research, evaluation, conference assets, secure-arch YAML home | **No** (not part of the `vibescan` tarball `files` list) |

## Scanner source of truth

- **Implementations** live under **`vibescan/src/`** (not at the repo root).
- **Build output** is **`vibescan/dist/`** only. A stray repo-root `dist/` is not supported and should not be treated as the scanner build.
- **CLI entry:** `vibescan/dist/system/cli/index.js` (exposed as bins `vibescan` and `secure` from the **`vibescan`** package).

## Commands (from repo root)

```bash
npm install
npm run build          # delegates to: npm run build -w vibescan
npm test               # delegates to: npm test -w vibescan
npx vibescan scan ./vibescan/src
```

Publish the scanner **from the `vibescan` workspace** (after build):

```bash
npm publish -w vibescan
```

## Legacy JS scanner

The old JavaScript-era package materials live under **`vibescan/legacy-js/`** for reference only. They are **not** the published package and are **not** a workspace publish target.

## Two “identities” by design

This repo intentionally combines:

1. **Product** — publishable packages (`vibescan`, `secure-arch` workspaces).
2. **Research** — benchmarks, results, poster docs, demo app.

That is a normal **monorepo** shape, not an unfinished migration. Optional future step (product strategy only): split `vibescan` into its own GitHub repo; the **layout inside this tree is already settled**.

## See also

- [`docs/REPO-HANDOFF.md`](./REPO-HANDOFF.md) — full handoff and file map.
- [`vibescan/README.md`](../vibescan/README.md) — npm-oriented quick start for consumers.
- [`docs/vibescan/release-checklist.md`](./vibescan/release-checklist.md) — publish safety.
