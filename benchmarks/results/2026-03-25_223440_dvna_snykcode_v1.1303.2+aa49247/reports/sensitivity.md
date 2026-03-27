# Sensitivity analysis (vendor tools)

**Run:** `2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247`  
**Target:** DVNA (`benchmarks/dvna/dvna`)  
**Tool:** Snyk Code (vendor SAST baseline)  

## Result (this environment)

Snyk Code executed successfully after setting the org context and restoring the DVNA source path.

- Raw output (captured): `../snyk-code.json`
- Result summary: `36` findings (`4 error`, `27 warning`, `5 note`)
- Top rule concentration: `javascript/NoRateLimitingForExpensiveWebOperation` (`18` results)

## How to complete the vendor sensitivity run

1. Authenticate (if needed):

```bash
snyk auth
```

2. Re-run and capture JSON:

```bash
snyk code test benchmarks/dvna/dvna --json > benchmarks/results/<run-id>_dvna_snykcode/snyk-code.json
```

3. Record versions + DVNA SHA in a `manifest.json` in that run folder.

## Notes / limitations

- Vendor tool licensing/tiers and opaque rule mapping mean results should be reported as **sensitivity** only, separate from the primary (first-party) scope-normalized table.
- Snyk JSON was generated via PowerShell redirection and is UTF-16 encoded in this run artifact; downstream parsers may need BOM/encoding handling.

