# Context-aware prioritization (design, future work)

## Motivation

Flat severity labels do not capture **deployability** or **exposure**. A finding in an unused experimental route is less urgent than the same pattern on a production login path. This document sketches a **future** prioritization layer without claiming current implementation.

## Signals (inputs)

| Signal | Intended meaning | Feasibility |
|--------|------------------|-------------|
| Route exposed | Appears in route inventory and is not marked internal-only (heuristic) | Static path extraction; gateway config not modeled |
| Code in deployed build path | File is reachable from entrypoint/bundle graph | Requires build graph or tsconfig `include` heuristics |
| Production dependency | Package in `dependencies` vs `devDependencies` | Parse `package.json` near `projectRoot` |
| Route sensitivity | Tags: admin, auth, upload, webhook, messaging | Regex + inventory tags |
| Missing auth / rate limit | Existing `AUTH-*`, `MW-002` | Already partially available |

## Scoring sketch (example only)

A **priority score** could combine weighted factors, e.g.:

- Base: severity ordinal from finding.
- Boost: sensitive tag + production path.
- Reduce: file under `test/`, `__fixtures__`, or `*.test.js` patterns (configurable).

Weights must be **tuned on adjudicated benchmarks**; defaults should be conservative.

## Output

- Add `priority` or `priorityRank` to JSON (optional flag `--prioritize` in future).
- Keep raw `severity` for compatibility.

## Limitations (explicit)

- No runtime traffic, so “exposed” remains **approximate**.
- Monorepos and dynamic imports complicate build-path analysis.
- Overfitting to one benchmark must be avoided; report score calibration honestly.

## Evaluation

When implemented, compare ranked lists to adjudicator **severity × validity** using a simple metric (e.g., precision@k on “actionable” findings) and publish methodology alongside results.
