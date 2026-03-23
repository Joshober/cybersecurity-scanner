# VibeScan release checklist (npm publish safety)

Goal: publish only the reusable scanner package (package `vibescan`) and avoid shipping demo/research content.

## 1. Build + test

```bash
npm test -w vibescan
```

## 2. Sanity-check the npm tarball contents (required)

Run:

```bash
npm run release:check -w vibescan
```

Then verify the `npm pack --dry-run` file list contains only:

- `package.json`
- `README.md`
- `dist/**`

And does **not** include:

- `docs/`, `benchmarks/`, `results/`, `tests/`, `demo*`, or `legacy-*` source content

This is enforced primarily by `vibescan/package.json#files` (`["dist", "README.md"]`) plus the fact that `dist/` is generated from `vibescan/tsconfig.json` compiling only `vibescan/src/**`.

## 3. Publish

After the tarball check passes:

```bash
npm publish -w vibescan
```

## 4. Quick install verification

In a separate folder (or a clean scratch repo):

```bash
npx --yes vibescan scan ./vibescan/src --format json > vibescan.json
npx --yes vibescan scan ./vibescan/src --format sarif > vibescan.sarif
```

