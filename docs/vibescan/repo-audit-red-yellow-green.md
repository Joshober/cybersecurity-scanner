# VibeScan repo audit — red / yellow / green checklist

Use this file as the short operational checklist for stabilizing the repo before adding more major features.

---

## Green — acceptable / keep as-is

These items are in good enough shape to keep and build on.

- [ ] Root README reflects the current repo identity: root scanner + `secure-arch` workspaces
- [ ] DVNA benchmark file explicitly labels incomplete baselines as incomplete
- [ ] Benchmark/adjudication export commands are documented
- [ ] `secure-arch` is documented as a separate optional layer, not the scanner itself
- [ ] Rule catalog in README matches the intended active scan scope

---

## Yellow — working, but needs tightening soon

These items are not blockers by themselves, but they weaken trust if left unresolved.

- [ ] Handoff, audit, and benchmark docs all use the same file paths and package layout
- [ ] Every README-claimed rule has dedicated tests or is clearly labeled heuristic / limited
- [ ] High-value fixtures are wired into CI or copied into `benchmarks/seeded/`
- [ ] Public-facing docs clearly separate implemented features, evaluated features, and future work
- [ ] `secure-arch` is scoped consistently across README, poster docs, and research docs
- [ ] JSON/SARIF/export docs match the actual scanner output format
- [ ] One benchmark run folder exists with manifest + outputs + notes as the canonical example

---

## Red — fix before claiming the project is academically finished

These are the blockers for a strong research-quality repo state.

- [ ] `docs/vibescan/rule-coverage-audit.md` is updated to match the current root-based scanner layout
- [ ] Stale `packages/secure-code-scanner/...` references are removed or corrected
- [ ] DVNA commit SHA and tool versions are recorded for the benchmark used in reporting
- [ ] A completed adjudication artifact exists for at least one benchmark run
- [ ] TP / FP / FN metric definitions are written and tied to an evaluation doc
- [ ] Missing dedicated unit tests are added for currently claimed high-scope rules:
  - [ ] `crypto.jwt.weak-secret-literal`
  - [ ] `mw.cookie.missing-flags`
  - [ ] `RULE-SSRF-002`
  - [ ] `AUTH-005` (if paper scope includes access-control claims)
  - [ ] `MW-002`
  - [ ] `MW-003`
  - [ ] `MW-004`
- [ ] Baseline claims are aligned with actual runs (Snyk/Bearer only if actually executed and captured)
- [ ] One frozen benchmark result set exists under `benchmarks/results/<run-id>/`

---

## Suggested order of attack

1. **Docs consistency pass**
   - fix stale paths
   - align README, handoff, audit docs, and benchmark docs

2. **Evidence pass**
   - create one canonical benchmark run folder
   - record versions / commit SHA
   - fill manifest and adjudication sheet

3. **Test coverage pass**
   - add dedicated tests for high-scope claimed rules
   - wire fixtures into seeded benchmarks / CI

4. **Claims audit**
   - abstract
   - README summary text
   - poster text
   - judge prep
   - benchmark comparison language

5. **Only then add more major features**

---

## Finish-line definition

The repo is ready to describe as academically strong when:

- docs are internally consistent
- benchmark scope is reproducible
- at least one benchmark run is frozen and adjudicated
- missing high-priority claimed-rule tests are closed
- baseline comparisons match actual captured runs
- the repo clearly distinguishes evaluated artifact vs extension / future work
