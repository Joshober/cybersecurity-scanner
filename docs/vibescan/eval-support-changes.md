# Smallest code changes for easier academic evaluation

Constraints: **no change to core detection logic** unless unavoidable; focus on **metadata, format, and scope control** for benchmarks.

## 1. Stable rule IDs in output (documentation + lint)

**Issue:** Some IDs are already dotted (`crypto.hash.weak`) while others are legacy-style (`SEC-004`, `SSRF-003`, `RULE-SSRF-002`, `SLOP-001`, `AUTH-003`, `MW-*`).

**Smallest fix:**

- **Paper + manifest:** document the canonical ID map once (root README already lists many).
- **Optional code (non-behavioral):** add optional field `ruleIdCanonical` or `ruleFamily` in `findingToJson` **without** changing `ruleId` (avoids breaking ESLint plugin or downstream scripts). Populate via a static map in `format.ts`.

**Effort:** Low; **behavior:** unchanged if only adding fields.

## 2. Machine-readable run metadata

**Issue:** JSON output does not include scanner **version**, **git commit**, or **scan options**.

**Smallest fix:**

- Extend `formatProjectJson` (behind `--benchmark-metadata` or include when env `VIBESCAN_BENCHMARK=1`) with a top-level `run` object: `toolVersion` from `package.json`, `scanOptions` echo, `timestamp` ISO.
- **Version source:** read `version` from `vibescan/package.json` at build time (tsc could inject via `define` — slightly more work) or read at runtime via `readFileSync` near CLI — **small CLI-only change**.

**Effort:** Low–medium; **behavior:** unchanged for detection.

## 3. Benchmark-friendly JSON schema

**Issue:** Reviewers expect a stable schema for `summary` + `findings`.

**Smallest fix:**

- Add `docs/vibescan/vibescan-benchmark-output.schema.json` (JSON Schema) describing **current** `formatProjectJson` plus optional `summary` block from [`output-support-audit.md`](./output-support-audit.md).
- No runtime requirement; publish with the paper.

**Effort:** Low (docs only) or medium if generated from TypeScript types.

## 4. Exclude vendor / minified files (flag)

**Issue:** CLI globs `**/*.{js,ts,mjs,cjs}` under a directory ([`cli/index.ts`](../../vibescan/src/system/cli/index.ts)), which can pull in minified bundles and skew counts.

**Smallest fix:**

- Add `--ignore-glob` (repeatable) or `--benchmark-exclude-defaults` applying a conservative list (`**/vendor/**`, `**/*.min.js`, `**/dist/**`, optional).
- Implemented **only in CLI** when expanding the file list — **no engine change**.

**Effort:** Low; **behavior:** changes only which files are fed to the scanner when the flag is used.

## 5. Per-category summary output

**Issue:** Evaluators manually aggregate `category` and `severityLabel`.

**Smallest fix:**

- Implement `summary.categoryCounts` and `summary.severityCounts` in `formatProjectJson` as described in [`output-support-audit.md`](./output-support-audit.md), gated by flag or always appended as extra keys (most JSON consumers ignore unknown keys).

**Effort:** Low; **behavior:** unchanged.

## 6. Deterministic ordering for diffs

**Issue:** Finding order may vary between runs, making `diff` noisy.

**Smallest fix:**

- Sort `project.findings` and/or per-file findings by `(filePath, line, column, ruleId)` **only in JSON formatter** — does not affect rule firing, only output order.

**Effort:** Low; **behavior:** output order only (document in CHANGELOG for JSON users).

## Suggested implementation order

1. Deterministic JSON sort (if you need clean diffs immediately).
2. `summary` object in `formatProjectJson` + unit test.
3. CLI `--ignore-glob` / benchmark excludes.
4. Optional `run` metadata block.
5. Optional `ruleFamily` / schema doc.

## Out of scope (for this evaluation track)

- Rewriting taint or middleware audit logic.
- Registering `prototypePollution` or `jwt-weak-test` unless the paper explicitly evaluates them — that **would** change behavior.

