# Published npm packages

This repo ships one **public** scanner package from the `vibescan/` directory. Other folders under `packages/` may hold additional workspaces; treat this file as the index of **what consumers install**.

## VibeScan (static security scanner)

| | |
|---|---|
| **On npmjs (registry.npmjs.org)** | **`@jobersteadt/vibescan`** — [npmjs.com/package/@jobersteadt/vibescan](https://www.npmjs.com/package/@jobersteadt/vibescan) — use this for normal `npm install` / `npx` from the public registry. |
| **On GitHub Packages** | **`@joshober/vibescan`** — [GitHub → Packages](https://github.com/Joshober?tab=packages&q=vibescan); needs `.npmrc` + token (see [`vibescan/README.md`](../vibescan/README.md)). |
| **Source** | [`vibescan/`](../vibescan/) — `package.json` name is **`@joshober/vibescan`** (for GitHub + future npm alignment). |
| **CLI commands** | `vibescan` and `secure` (after install; see package `bin`) |
| **Full docs** | [`vibescan/README.md`](../vibescan/README.md) |

Quick install from **npm** (e.g. another project on your machine):

```bash
npm i @jobersteadt/vibescan@1.0.0
npx @jobersteadt/vibescan scan .
```

### Unscoped name on npm

The unscoped package **`vibescan`** on [npmjs.com](https://www.npmjs.com/package/vibescan) is maintained by someone else and is **not** this project.

**Why two scoped names?** GitHub Packages requires the scope to match a **real GitHub** owner (`@joshober`). Your **npm** publish used the **`@jobersteadt`** scope. **`@joshober/vibescan` is not published on npmjs yet**; use **`@jobersteadt/vibescan`** there until you publish the `@joshober` scope to npm with an account that owns it.

### Maintainers: publish to GitHub Packages

From [`vibescan/`](../vibescan/), after [GitHub CLI](https://cli.github.com/) is installed and you are logged in (`gh auth login`):

```bash
# If publish returns 403, grant the CLI token package write:
gh auth refresh -s write:packages -h github.com

npm run publish:github-packages
```

That script runs `gh auth token`, sets `NODE_AUTH_TOKEN`, and runs `npm publish` with [`vibescan/.npmrc.github-packages`](../vibescan/.npmrc.github-packages).

For **npmjs**, publish from the same folder with your npm login and default registry (`npm publish` without the GitHub userconfig). To use **one** scope on both registries, publish **`@joshober/vibescan`** to npmjs as well (requires npm permissions on the `@joshober` scope), then deprecate **`@jobersteadt/vibescan`**.
