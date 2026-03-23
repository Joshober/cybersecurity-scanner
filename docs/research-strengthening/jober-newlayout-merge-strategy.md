# Carving `Jober/NewLayout` into mergeable pieces

**Intent:** Keep **research merges** independent of **layout/refactor** work. Academic work should land on `master` from `docs/research-strengthening` (or similar) without waiting for a megamerge.

**Hybrid layout (this repo’s `main`):** The scanner remains at **repo root** (`src/`). **secure-arch** is under `packages/secure-arch-*`, `architecture/secure-rules/`, and `docs/secure-arch/`—NewLayout features without relocating VibeScan into `packages/secure-code-scanner/`.

## What to verify on `Jober/NewLayout` first

Run from repo root on that branch:

```bash
npm install
npm run build
npm test
npx vibescan scan ./src --format compact
npx secure-arch check --root . --code-evidence js-ts
```

Document results in the PR that proposes merging layout changes. If any command fails, **do not** merge to `master` until fixed or the PR is split.

## Suggested slice order (smallest risk first)

### Slice 1 — Documentation only

- Research docs under `docs/research-strengthening/` and updates under `docs/vibescan/`.
- **Target branch:** `master` (or merge `origin/docs/research-strengthening` and reconcile with local files).

**No** package moves required.

### Slice 2 — secure-arch as self-contained packages

- Anything under `packages/secure-arch-*`, `docs/secure-arch/`, templates—**if** paths in READMEs and CLI still resolve from root after merge.
- Avoid renaming the root package or scanner package in the same PR.

### Slice 3 — Scanner package path / workspace layout

- Moving `secure-code-scanner` or changing workspace names **only after** benchmarks and `reproducible-runs.md` are updated so **historical commands** still work or are clearly versioned in the manifest.

### Slice 4 — Root identity / monorepo branding

- `package.json` name, default scripts, CI—last, when evaluation is frozen or scripts are dual-documented (“before” vs “after”).

## What not to mix

| Do merge together | Do not merge together |
|-------------------|------------------------|
| Docs + small typo fixes in same PR | Docs + 500-file rename |
| secure-arch package + its docs | secure-arch + scanner detection changes |
| Scanner path move + updated README paths | Scanner path move + abstract rewrite |

## Git workflow sketch

```text
master  ◀── merge docs/research-strengthening (academic only)

Jober/NewLayout ──(cherry-pick or PR1)──▶ master   # docs OK
Jober/NewLayout ──(PR2 secure-arch only)──▶ master   # after tests
Jober/NewLayout ──(PR3 layout)───────────▶ master   # after benchmark script update
```

## Academic “clean decision” summary

- **For poster/paper:** merge **research** into `master`; keep the evaluated artifact story on VibeScan + benchmarks.
- **For product:** iterate on `Jober/NewLayout` (or a branch from it), split PRs, then merge when green.
- **For reviewers:** state explicitly that secure-arch is **product extension**, not the evaluated contribution, unless you add a separate study.

## Remote branches (this repo snapshot)

- `origin/master` — integration target for research.
- `origin/docs/research-strengthening` — may contain overlapping files (e.g. `docs/vibescan/research-question.md`); reconcile with this folder when merging.
