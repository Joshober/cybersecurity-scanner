# Benchmark scripts

Prerequisites: Node 18+, repo built (`npm run build`). For Bearer: Docker with daemon running **or** [Bearer CLI](https://docs.bearer.com/reference/installation) on Linux/macOS/WSL.

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `DVNA_ROOT` | `benchmarks/dvna/dvna` if present, else `dvna` | Path to DVNA clone |
| `REPO_ROOT` | Parent of `benchmarks/` | Repository root |

## VibeScan on DVNA

- **Windows:** [`run-vibescan-dvna.ps1`](./run-vibescan-dvna.ps1)
- **POSIX:** [`run-vibescan-dvna.sh`](./run-vibescan-dvna.sh)

Writes JSON under `benchmarks/results/<timestamp>_dvna_vibescan/` when `DVNA_ROOT` exists.

## Bearer on DVNA (Docker)

- **Windows / POSIX:** [`run-bearer-dvna.ps1`](./run-bearer-dvna.ps1) · [`run-bearer-dvna.sh`](./run-bearer-dvna.sh)

If Docker is not running, the script exits non-zero; see [`../../results/bearer-dvna.txt`](../../results/bearer-dvna.txt).

Successful output should be copied to `benchmarks/results/<run>/bearer.json` and referenced from [`../../results/dvna-evaluation.md`](../../results/dvna-evaluation.md).
