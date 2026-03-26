# Evaluation output + CLI support (formatter-only improvements)

This document consolidates the evaluation-oriented notes about **machine-readable summaries**, **benchmark metadata**, and **scope control** without changing detection logic.

## Goal

Enable clean, repeatable evaluation artifacts (JSON schema stability, deterministic ordering, summaries) with changes limited to:

- formatting layer (`formatProjectJson`)
- CLI plumbing (flags, file selection)
- documentation/schema/tests

## Current state (high-level)

- JSON project output is produced by `formatProjectJson` in `src/system/format.ts`.
- CLI `--format json` routes through `src/system/cli/index.ts`.
- Types live in `src/system/types.ts` (e.g., `Finding`, `ProjectScanResult`).

## Recommended extension points (safe order)

### 1) Add a `summary` block in `formatProjectJson` (lowest risk)

Add computed fields alongside existing keys (no detection changes):

- `summary.ruleCounts: Record<string, number>`
- `summary.severityCounts`
- `summary.categoryCounts`
- `summary.findingsPerFile`

### 2) Gate benchmark-only fields behind a flag/env

Keep default output stable; enable evaluation fields only when:

- `--benchmark-metadata` is set, or
- env `VIBESCAN_BENCHMARK=1` is present

### 3) Add `--ignore-glob` / benchmark exclude defaults

Allow repeatable scope control (vendor/minified/dist) without touching engines; implement only in CLI file expansion.

### 4) Deterministic ordering for diffs

Sort findings only in the JSON formatter by a stable key (e.g., `(filePath, line, column, ruleId)`).

### 5) Canonical rule grouping (non-breaking)

If desired, add a derived field like `ruleFamily` (or `ruleIdCanonical`) without changing existing `ruleId` strings.

## What not to change in this track

- rule engines (AST rules, taint, middleware audits)
- rule registration/coverage (e.g., enabling prototype pollution experiments) unless the evaluation scope explicitly includes it

## Schema + tests

- Keep the JSON schema up to date:
  - `docs/vibescan/vibescan-benchmark-output.schema.json`
- Add a unit test under `tests/unit/` that asserts summary counts are correct for a minimal project scan.

