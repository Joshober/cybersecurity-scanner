# Benchmark scripts

Prerequisites: Node 18+, repo built (`npm run build`). For Bearer: Docker with daemon running **or** [Bearer CLI](https://docs.bearer.com/reference/installation) on Linux/macOS/WSL.

Fast regression lane (committed artifacts only):

```bash
npm run benchmark:validate
node benchmarks/scripts/run-framework-vuln-scan.mjs --out-dir benchmarks/results/ci_framework_vulns_vibescan
```

Heavy DVNA lane (scheduled / manual friendly):

```bash
node benchmarks/scripts/run-dvna-vibescan-scan.mjs --out-dir benchmarks/results/ci_dvna_vibescan_cli --generate-tests benchmarks/results/ci_dvna_vibescan_proofs
node vibescan/scripts/run-generated-proofs.mjs benchmarks/results/ci_dvna_vibescan_proofs
```

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `DVNA_ROOT` | `benchmarks/dvna/dvna` if present, else `dvna` | Path to DVNA clone |
| `REPO_ROOT` | Parent of `benchmarks/` | Repository root |

## VibeScan on DVNA

- **Windows:** [`run-vibescan-dvna.ps1`](./run-vibescan-dvna.ps1)
- **POSIX:** [`run-vibescan-dvna.sh`](./run-vibescan-dvna.sh)

Writes JSON under `benchmarks/results/<timestamp>_dvna_vibescan/` when `DVNA_ROOT` exists. Use `--out-dir <path>` in CI when you need deterministic artifact locations.

## Bearer on DVNA (Docker)

- **Windows / POSIX:** [`run-bearer-dvna.ps1`](./run-bearer-dvna.ps1) · [`run-bearer-dvna.sh`](./run-bearer-dvna.sh)

If Docker is not running, the script exits non-zero; see [`../../results/bearer-dvna.txt`](../../results/bearer-dvna.txt).

Successful output should be copied to `benchmarks/results/<run>/bearer.json` and referenced from [`../../results/dvna-evaluation.md`](../../results/dvna-evaluation.md).
