# Baseline tools

- **eslint.eslintrc.cjs** — used by `scripts/run-comparison.mjs` with `npx eslint -c …` from the monorepo root (so `eslint-plugin-security` resolves from the root `devDependencies`).
- **npm audit** — run against `demo/comparison/package.json` after `npm install` in `demo/comparison/`. Interprets **dependency** advisories; gold-path snippets may not map 1:1 to those CVEs.
- **Bearer / Snyk** — invoked only if the `bearer` or `snyk` binary is on `PATH`; otherwise the harness records `skipped: true`.
