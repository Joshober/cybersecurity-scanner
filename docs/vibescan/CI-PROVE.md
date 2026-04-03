# CI: running VibeScan-generated proof tests

VibeScan can emit deterministic **`node:test`** files (e.g. `*.test.mjs`) via `vibescan scan --generate-tests` or `vibescan prove`. This page describes how to run them in CI and how **determinism flags** appear in JSON.

## Generate proofs

From your project (example):

```bash
npx @jobersteadt/vibescan scan . --exclude-vendor --generate-tests ./vibescan-proofs
```

Equivalent using the `prove` subcommand (same behavior as `--generate-tests`):

```bash
npx @jobersteadt/vibescan prove . --output ./vibescan-proofs
```

Each supported finding may get a companion file such as `ruleid_0.test.mjs` plus shared helpers (e.g. `vibescan-proof-crypto.mjs`).

## Run proofs locally or in CI

**Node 18+** built-in test runner:

```bash
node --test ./vibescan-proofs
```

Node discovers `*.test.js` / `*.test.mjs` (and related patterns) under that directory.

**Wrapper script** (repository helper):

```bash
node vibescan/scripts/run-generated-proofs.mjs ./vibescan-proofs
```

Exit code follows `node --test`: `0` if all tests pass, non-zero on failure.

### Recorded harness (`vibescan prove --run`)

The log includes **`retriesPerFile`**, and each entry may include **`perRun`** (per attempt), **`stability`** (`stable` | `flaky` | `error`), and **`summary.flaky`** when retries are used:

```bash
npx @jobersteadt/vibescan prove --run --from ./vibescan.json --retries 3 --output ./proof-run-log.json
```

- **stable**: all attempts agreed on pass/fail.
- **flaky**: mixed outcomes across retries (treated as inconclusive for pass/fail counts).
- **error**: spawn failure or inconclusive runs (e.g. no tests found).

Generated project JSON can include **`proofHarness`** on a finding (`isolation: mock | pure`) when the proof generator declares it.

## SARIF import and merge

- **`vibescan import-sarif results.sarif`**: optional **`vibescan-sarif-rule-map.json`** at the repo root, or **`--rule-map path.json`**. See **`templates/sarif-rule-map.sample.json`** in the package.
- **`vibescan import-sarif results.sarif --project . --emit-proofs ./proofs`**: native scan + imports; imports at the same **file path + line** as a native finding are dropped in favor of the native row.

## Fix preview (before/after proofs)

```bash
npx @jobersteadt/vibescan fix-preview --project-root . --patch ./fix.diff --output ./fix-preview-result.json
```

Requires **`patch`** (e.g. Git Bash) or a **`git apply`**-compatible apply after `git init` in the temp tree. Temps are deleted after the command finishes.

### GitHub Actions (example)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "22"

- name: VibeScan scan + proofs
  run: |
    npx @jobersteadt/vibescan scan . --exclude-vendor --generate-tests ./vibescan-proofs
    node --test ./vibescan-proofs
```

Do **not** start a live server for these proofs: they are designed for isolated, local checks (mocks / pure functions) per supported families.

## JSON: `ProofGeneration` and determinism

When exporting structured JSON with evidence fields (`--benchmark-metadata` / internal `includeEvidenceFields`), each finding can include:

| Field | Meaning |
|-------|--------|
| `proofGeneration.deterministic` | Generator asserts repeatability without network (optional). |
| `proofGeneration.requiresNetwork` | Proof validation would need network (rare for emitted tests). |
| `proofGeneration.requiresSecrets` | Needs secrets from the environment. |
| `proofGeneration.requiresEnv` | Depends on non-secret environment variables. |

These mirror the research “determinism index” and feed **`proofMetrics`** in exports (`requiresNetwork`, `requiresSecrets`, `requiresEnv`, `deterministic`).

## Windows note

On Windows, set **`PYTHONUTF8=1`** when using other tools (e.g. Semgrep SARIF) in the same pipeline; VibeScan proof tests are plain Node and do not require this.
