# Recall Outperform Readout

Canonical recall readout generated from committed benchmark artifacts.

| Tool | Corpus | Recall |
|---|---|---|
| VibeScan | Expanded framework corpus (28 rows) | 28/28 (100.0%) |
| VibeScan | DVNA (11 rows) | 11/11 (100.0%) |
| Bearer | DVNA (11 rows) | 8/11 (72.7%) |
| Snyk Code | DVNA (11 rows) | 7/11 (63.6%) |
| Semgrep | DVNA (11 rows) | 4/11 (36.4%) |
| CodeQL | DVNA (11 rows) | 6/11 (54.5%) |
| eslint-plugin-security | DVNA (11 rows) | 1/11 (9.1%) |

## Notes
- DVNA values come from `results/dvna-detection-matrix.json`.
- Expanded corpus value comes from `results/framework-vuln-case-catalog.json` + `benchmarks/results/ci_framework_vulns_vibescan/vibescan-project.json`.
- Scope caveat: this compares benchmarked SAST rows, not SCA/CVE coverage.
