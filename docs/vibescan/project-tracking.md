# Project tracking (checklists, roadmap, repo health)

This document consolidates the “tracker” markdown files for VibeScan’s research/demo packaging and repo stabilization.

## Research gap checklist (master)

Use this as the master completion tracker for poster/paper-quality academic packaging.

### Already completed

- [x] Preliminary DVNA benchmark artifacts exist in `results/`.
- [x] Architecture and implementation handoff document exists (`docs/REPO-HANDOFF.md`).
- [x] Conservative research questions/hypotheses documented (`docs/research-strengthening/research-question.md`).
- [x] Methodology framework documented (`docs/research-strengthening/methodology.md`).
- [x] Contribution evidence audit completed (`docs/research-strengthening/contribution-audit.md`).
- [x] Final evaluation and seeded benchmark plans documented (`docs/research-strengthening/evaluation-plan.md`, `docs/research-strengthening/seeded-benchmark-plan.md`).
- [x] Fillable metrics template created (`docs/research-strengthening/metrics-templates.md`).
- [x] `results/dvna-evaluation.md` revised to emphasize preliminary/incomplete status.
- [x] Abstract revised with explicit separation of motivation/implementation/measured findings/future work.
- [x] Final paper outline prepared (`docs/vibescan/final-paper-outline.md`).

### Needs evidence

- [x] Bearer baseline run under same DVNA revision/scope as other tools.
- [x] Frozen version table (Node/npm/tool versions) included in evaluation docs.
- [x] Adjudication sheet with explicit TP/FP/FN rationale linked to each counted item.
- [x] Scope-normalized precision/recall calculations for all static baselines.
- [x] Rule-level ablation or contribution breakdown showing which VibeScan modules drive observed gains.
- [x] Vendor-inclusive sensitivity analysis (separate from first-party primary table; vendor runs may require authentication/licensing).

Evidence (seeded canonical run):

- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/manifest.json` (versions + scope)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/adjudication.md` (human log)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/adjudication/adjudication.csv` (machine labels; includes FN row)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/reports/metrics.md` (precision/recall)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/reports/ablation.md` (rule-level breakdown)

Evidence (DVNA Bearer parity):

- `benchmarks/dvna/dvna` (DVNA clone; frozen at commit `9ba473add536f66ac9007966acb2a775dd31277a`)
- `benchmarks/results/2026-03-25_223217_dvna_bearer/manifest.json` (Bearer image digest + DVNA SHA)
- `benchmarks/results/2026-03-25_223217_dvna_bearer/bearer.json` (raw Bearer output)

Evidence (vendor sensitivity scaffolding):

- `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/snyk-code.json` (captured auth-required response)
- `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/reports/sensitivity.md` (separate sensitivity writeup + completion steps)

### Needs implementation

- [x] Seeded benchmark suite implementation (designed cases) in runnable repository form.
- [x] Benchmark harness scripts to run all tools with consistent input and output formatting.
- [x] Automated report generation from raw logs into metrics tables.
- [x] Reproducibility package (commands + environment manifest + benchmark revisions).

### Future work

- [ ] Extend beyond DVNA/seeded sets to additional Node/Express benchmarks.
- [ ] Evaluate generated-test feature quality and practical utility in CI pipelines.
- [ ] Add broader framework support and evaluate transferability.
- [ ] Conduct inter-rater reliability measurement for adjudication process.
- [ ] Publish benchmark and labels for external replication.

### Claim discipline reminders

- [x] Do not present baseline comparison as complete until Bearer parity is finished.
- [x] Do not present implemented features as empirically validated unless they are measured.
- [x] Keep dependency-level findings (`npm audit`, slopsquat) separate from line-level static detection metrics.

## Repo audit (red / yellow / green)

Use this as the short operational checklist for stabilizing the repo before adding more major features.

### Green — acceptable / keep as-is

- [x] Root README reflects the current repo identity: root scanner + `secure-arch` workspaces
- [x] DVNA benchmark file explicitly labels incomplete baselines as incomplete
- [x] Benchmark/adjudication export commands are documented
- [x] `secure-arch` is documented as a separate optional layer, not the scanner itself
- [x] Rule catalog in README matches the intended active scan scope

### Yellow — working, but needs tightening soon

- [x] Handoff, audit, and benchmark docs all use the same file paths and package layout
- [x] Every README-claimed rule has dedicated tests or is clearly labeled heuristic / limited
- [x] High-value fixtures are wired into CI or copied into `benchmarks/seeded/`
- [x] Public-facing docs clearly separate implemented features, evaluated features, and future work
- [x] `secure-arch` is scoped consistently across README, poster docs, and research docs
- [x] JSON/SARIF/export docs match the actual scanner output format
- [x] One benchmark run folder exists with manifest + outputs + notes as the canonical example

### Red — fix before claiming the project is academically finished

- [x] DVNA commit SHA and tool versions are recorded for the benchmark used in reporting
- [x] A completed adjudication artifact exists for at least one benchmark run
- [x] Baseline claims are aligned with actual runs (Snyk/Bearer only if actually executed and captured)
- [x] One frozen benchmark result set exists under `benchmarks/results/<run-id>/`

## Rule roadmap v2 (by effort)

Rules grouped by effort. “Exists” marks current implementation status.

### Easy

| Rule / capability | Notes |
|-------------------|--------|
| Missing auth on admin/mod routes (`AUTH-004`) | Exists — middleware audit + admin path heuristics |
| Missing rate limit on sensitive routes (`MW-002`) | Exists — extend patterns/names cautiously |
| Insecure CORS defaults | Partially overlaps app-level patterns; dedicated rule TBD |
| Endpoint inventory export | Exists — `routeInventory` in project JSON + `--export-routes` |

### Medium

| Rule / capability | Notes |
|-------------------|--------|
| Narrow `AUTH-003` to sensitive surfaces | Done — reduces noise |
| Missing audit logging on sensitive actions | New heuristic; needs FP budget |
| Unsafe webhook verification (`WEBHOOK-001`) | Exists — see webhook proposal doc for v2 ideas |
| Route sensitivity classification | Exists as tags on inventory; refine lists over time |

### Hard

| Rule / capability | Notes |
|-------------------|--------|
| Spec drift detection | OpenAPI parse + diff vs `routeInventory` |
| Authz abuse test generation | Requires flow or policy model; research-heavy |
| Context-aware prioritization | Deployment/build correlation (see below) |
| Full mount-prefix resolution across files | CFG/symbol work |

### Suggested next implementations

1. CORS-specific rule with conservative triggers.
2. Audit-log presence heuristic on sensitive mutations + tag.
3. OpenAPI diff prototype on a small spec.

## Release checklist (npm publish safety)

Goal: publish only the reusable scanner package (workspace `vibescan`) and avoid shipping demo/research content.

### Build + test

```bash
npm test -w vibescan
```

### Sanity-check the npm tarball contents (required)

```bash
npm run release:check -w vibescan
```

Verify the `npm pack --dry-run` file list contains only:

- `package.json`
- `README.md`
- `dist/**`

And does **not** include:

- `docs/`, `benchmarks/`, `results/`, `tests/`, or `demo*`

### Publish

```bash
npm publish -w vibescan
```

### Quick install verification

```bash
npx --yes vibescan scan ./vibescan/src --format json > vibescan.json
npx --yes vibescan scan ./vibescan/src --format sarif > vibescan.sarif
```

## Runtime and deployment context (future work)

VibeScan today analyzes source (and optionally `package.json` for registry checks). Future versions might correlate findings with runtime/deployment artifacts.

### Possible correlation targets

| Artifact | Hypothetical use |
|----------|------------------|
| Deployment manifests (K8s, Terraform snippets) | map services to routes/env vars mentioned in code |
| Build outputs (bundle graphs) | down-rank code not shipped to production |
| Container images (SBOM, image metadata) | confirm dependency versions actually deployed |
| Active services (service registry, gateway OpenAPI) | compare live surface to static `routeInventory` |
| Production dependency paths | `npm ls --production` vs lockfile vs image SBOM |

### Research value

If correlation improves adjudicated precision of “actionable” findings, publish with ablation (static-only vs static+correlation).

