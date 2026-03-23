# VulnLab — curated Express benchmark (better DVNA for VibeScan)

**VulnLab** is a **small, committable** Node/Express application with **documented intentional flaws**. Use it when you need:

| vs upstream [DVNA](https://github.com/appsecco/dvna) | VulnLab |
|------------------------------------------------------|---------|
| Large third-party app, noisy vendor JS | **One file** (`server.js`), no minified bundles |
| Implicit ground truth | **[GROUND_TRUTH.md](./GROUND_TRUTH.md)** + reproducible `vibescan` JSON |
| Clone + lockfile drift | **Pinned** `package.json` / `package-lock.json` in-repo |
| Mixed OWASP themes | **Focused** on patterns VibeScan targets (crypto, injection, middleware, SSRF helper) |

**Security:** do **not** deploy. For benchmarks and local scans only.

## Quick scan

From repository root (after `npm install` at root):

```bash
npm run build -w vibescan
node vibescan/dist/system/cli/index.js scan benchmarks/vuln-lab --format json --exclude-vendor --benchmark-metadata
```

With adjudication export + manifest (pick a dated folder under `benchmarks/results/`):

```bash
RUN=benchmarks/results/$(date -u +%Y-%m-%d_%H%M%S)_vuln_lab
mkdir -p "$RUN"
node vibescan/dist/system/cli/index.js scan benchmarks/vuln-lab \
  --format json --exclude-vendor --benchmark-metadata \
  --manifest "$RUN/manifest.json" \
  --export-adjudication "$RUN/vibescan-adjudication"
```

## Install deps (first time or after lockfile change)

```bash
cd benchmarks/vuln-lab && npm ci
```

## Full baseline bundle (VibeScan + eslint + npm audit)

See [`../scripts/run-vuln-lab-baselines.sh`](../scripts/run-vuln-lab-baselines.sh) and [`../scripts/run-vuln-lab-baselines.ps1`](../scripts/run-vuln-lab-baselines.ps1).

## Relationship to DVNA

- **DVNA** remains the external “real app” benchmark target under [`../dvna/README.md`](../dvna/README.md) (gitignored clone).
- **VulnLab** is the **in-repo reference corpus** for stable regression, demos, and paper-grade adjudication without cloning.
