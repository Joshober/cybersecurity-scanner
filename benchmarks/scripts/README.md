# Benchmark scripts

Prerequisites: Node 18+, VibeScan built (`npm run build -w vibescan`). For Bearer: Docker with daemon running **or** [Bearer CLI](https://docs.bearer.com/reference/installation) on Linux/macOS/WSL.

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `DVNA_ROOT` | `benchmarks/dvna/dvna` if present, else `dvna` | Path to DVNA clone |
| `REPO_ROOT` | Parent of `benchmarks/` | Repository root |

## VibeScan on DVNA

- **Windows:** [`run-vibescan-dvna.ps1`](./run-vibescan-dvna.ps1)
- **POSIX:** [`run-vibescan-dvna.sh`](./run-vibescan-dvna.sh)

Writes JSON under `benchmarks/results/<timestamp>_dvna_vibescan/` when `DVNA_ROOT` exists.

## VulnLab (committable “better DVNA”)

Single-file Express benchmark with documented expectations — no clone required.

- **Full bundle (VibeScan + eslint + npm audit + manifest + adjudication):**
  - **Windows:** [`run-vuln-lab-baselines.ps1`](./run-vuln-lab-baselines.ps1)
  - **POSIX:** [`run-vuln-lab-baselines.sh`](./run-vuln-lab-baselines.sh)

Writes under `benchmarks/results/<timestamp>_vuln_lab_baselines/`. See [`../vuln-lab/README.md`](../vuln-lab/README.md).

## Bearer on DVNA (Docker)

- **Windows / POSIX:** [`run-bearer-dvna.ps1`](./run-bearer-dvna.ps1) · [`run-bearer-dvna.sh`](./run-bearer-dvna.sh)

If Docker is not running, the script exits non-zero; see [`../results/legacy/bearer-dvna.txt`](../results/legacy/bearer-dvna.txt).

Successful output should be copied to `benchmarks/results/<run>/bearer.json` and referenced from [`../results/legacy/dvna-evaluation.md`](../results/legacy/dvna-evaluation.md).

## ESLint baseline on DVNA

- **Windows / POSIX:** [`run-eslint-dvna.ps1`](./run-eslint-dvna.ps1) · [`run-eslint-dvna.sh`](./run-eslint-dvna.sh)

Writes `eslint.json` under `benchmarks/results/<timestamp>_dvna_eslint/`.

## npm audit baseline on DVNA

- **Windows / POSIX:** [`run-npm-audit-dvna.ps1`](./run-npm-audit-dvna.ps1) · [`run-npm-audit-dvna.sh`](./run-npm-audit-dvna.sh)

Writes `npm-audit.json` under `benchmarks/results/<timestamp>_dvna_npm_audit/`.

## Formal adjudication metrics (TP/FP/FN)

Export adjudication rows from VibeScan:

```bash
node vibescan/dist/system/cli/index.js scan "$DVNA_ROOT" --format json --exclude-vendor --export-adjudication benchmarks/results/<run>/vibescan-adjudication
```

Then fill `reviewerVerdict` (`tp`, `fp`, `fn`, or `ignore`) and compute metrics:

```bash
node benchmarks/scripts/adjudication-metrics.mjs benchmarks/results/<run>/vibescan-adjudication.csv
```

The script outputs precision/recall/F1 and exits non-zero when rows remain unlabeled.
