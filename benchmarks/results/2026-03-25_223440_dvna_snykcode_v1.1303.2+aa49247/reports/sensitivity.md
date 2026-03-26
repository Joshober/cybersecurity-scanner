# Sensitivity analysis (vendor tools)

**Run:** `2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247`  
**Target:** DVNA (`benchmarks/dvna/dvna`)  
**Tool:** Snyk Code (vendor SAST baseline)  

## Result (this environment)

Snyk Code requires authentication before it will execute a scan.

- Raw output (captured): `../snyk-code.json`
- Error: `Use \`snyk auth\` to authenticate.`

## How to complete the vendor sensitivity run

1. Authenticate:

```bash
npx --yes snyk auth
```

2. Re-run and capture JSON:

```bash
npx --yes snyk code test benchmarks/dvna/dvna --json > benchmarks/results/<run-id>_dvna_snykcode/snyk-code.json
```

3. Record versions + DVNA SHA in a `manifest.json` in that run folder.

## Notes / limitations

- Vendor tool licensing/tiers and opaque rule mapping mean results should be reported as **sensitivity** only, separate from the primary (first-party) scope-normalized table.
- Until authenticated output is captured, this run folder is evidence of **attempt + required precondition**, not a completed baseline.

