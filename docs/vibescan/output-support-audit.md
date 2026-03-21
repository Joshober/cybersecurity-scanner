# Where to add structured benchmark output (audit)

**Goal:** Machine-readable **summaries** (rule counts, per-file rollups, severity totals) without changing **detection** behavior — only formatting and CLI plumbing.

## Current state

### JSON shape today

- **Per-file + findings:** `formatJson` in [`packages/secure-code-scanner/src/system/format.ts`](../../packages/secure-code-scanner/src/system/format.ts) maps each `Finding` via `findingToJson` (`ruleId`, `severity`, `severityLabel`, `category`, `line`, `filePath`, etc.).
- **Project scan:** `formatProjectJson` adds `routes`, `packageJsonPath`, flat `findings`, and `fileResults[]` with nested `findings` — already suitable for **per-file** extraction.

### CLI wiring

- [`packages/secure-code-scanner/src/system/cli/index.ts`](../../packages/secure-code-scanner/src/system/cli/index.ts): `--format json` calls `formatProjectJson(project)` for static multi-file scans (the common benchmark path).

### Types

- [`packages/secure-code-scanner/src/system/types.ts`](../../packages/secure-code-scanner/src/system/types.ts): `Finding`, `ProjectScanResult` — stable fields for aggregation.

## Easiest extension points (recommended order)

### 1. **Post-process in `formatProjectJson`** (lowest risk)

**Location:** [`format.ts`](../../packages/secure-code-scanner/src/system/format.ts), end of `formatProjectJson` (or a new helper `summarizeProject(project): BenchmarkSummary` used only when a flag is set).

**Add computed fields** alongside existing keys, e.g.:

- `summary.ruleCounts: Record<string, number>` — count by `finding.ruleId`
- `summary.severityCounts` — by `severity` or `severityLabel`
- `summary.categoryCounts` — by `finding.category`
- `summary.findingsPerFile: Record<string, number>` — derived from `project.findings` or `fileResults`

**Why here:** Single choke point; no changes to `scanner.ts` or rule engines; JSON consumers get summaries without reimplementing aggregation in bash/Python.

### 2. **Optional CLI flag** (keeps default output backward compatible)

**Location:** [`cli/index.ts`](../../packages/secure-code-scanner/src/system/cli/index.ts).

**Example:** `--benchmark-summary` or `--format jsonl` (if line-delimited is preferred for pipelines).

Only when the flag is set, call an extended formatter; default `formatProjectJson` remains unchanged for existing users.

### 3. **Exported pure function for eval scripts**

**Location:** export `summarizeFindings(findings: Finding[])` from `format.ts` or a tiny new `benchmarkSummary.ts` imported by `format.ts` and optionally by tests.

**Why:** Lets evaluation harnesses `import` the same logic as the CLI without shell JSON parsing.

## What not to change first

- **Rule engines** (`runRuleEngine`, taint, audits) — unnecessary for summaries.
- **`findingToJson` field set** — add fields only if needed for schema stability; prefer a sibling `summary` object.

## Test hook

- Add a **unit test** under `tests/unit/` that feeds a minimal `ProjectScanResult` (or builds one via `scanProject` on a small string) and asserts `ruleCounts` / `severityCounts` match expectations. Keeps evaluation math honest when findings shape evolves.

## Related docs

- Proposed CLI/format tweaks: [`eval-support-changes.md`](./eval-support-changes.md)
