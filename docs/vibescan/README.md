# VibeScan conference materials

Assets for poster, abstract, pitch, handout, and QR code. Open HTML files in a browser; print to PDF when ready.

For product/CLI usage, use the canonical docs in [`../../README.md`](../../README.md) and [`../../vibescan/README.md`](../../vibescan/README.md).

| File | Purpose |
|------|---------|
| [`../REPO-HANDOFF.md`](../REPO-HANDOFF.md) | **Codebase / architecture summary** for collaborators or LLMs (pipeline, paths, what’s implemented). |
| [`../research-strengthening/README.md`](../research-strengthening/README.md) | **Academic spine:** RQ, methodology, evaluation, seeded plan, and metrics. |
| [`vibescan-research-poster.html`](./vibescan-research-poster.html) | Main research poster (dark theme, cards, DVNA table per `results/dvna-evaluation.md`). |
| [`qr-github.svg`](./qr-github.svg) | 120×120-style QR (white modules on `#0a0a0f`) for `https://github.com/Joshober/cybersecurity-scanner`. |
| [`abstract.md`](./abstract.md) | Paste-up abstract + citation checklist. |
| [`pitch-60s.md`](./pitch-60s.md) | 60s script + six judge cue cards. |
| [`handout.html`](./handout.html) | A5 handout; print in grayscale to verify contrast. |
| [`SUBMISSION-CHECKLIST.md`](./SUBMISSION-CHECKLIST.md) | Logistics (form, chair, deadlines). |
| [`project-tracking.md`](./project-tracking.md) | Consolidated checklists + roadmap + repo health tracker (includes rubric status). |
| [`judging-pack.md`](./judging-pack.md) | Judge prep: research framing + source tiers + rigor talking points. |
| [`demo-plan.md`](./demo-plan.md) | Consolidated conference demo plan (examples, seeded app designs, folder layout). |
| [`rule-coverage-audit.md`](./rule-coverage-audit.md) | Rules × unit tests, fixtures, README, benchmark relevance. |
| [`../research-strengthening/benchmarking-runbook.md`](../research-strengthening/benchmarking-runbook.md) | Benchmark folder layout + reproducible runbook (canonical). |
| [`benchmark-manifest-template.json`](./benchmark-manifest-template.json) | Run metadata template (copy per experiment). |
| [`adjudication-template.md`](./adjudication-template.md) | Per-finding ground-truth labeling table. |
| [`../research-strengthening/eval-output-and-cli-support.md`](../research-strengthening/eval-output-and-cli-support.md) | Formatter/CLI support notes for evaluation (canonical). |
| [`vibescan-benchmark-output.schema.json`](./vibescan-benchmark-output.schema.json) | JSON Schema for project scan output (incl. `--benchmark-metadata`). |
| [`baselines-and-positioning.md`](./baselines-and-positioning.md) | Consolidated positioning + baseline comparison plans (Snyk/DAST/etc.). |
| [`research-scope-v2.md`](./research-scope-v2.md) | Updated RQ, hypotheses (conservative). |
| [`surface-and-boundaries.md`](./surface-and-boundaries.md) | Trust boundaries, endpoint discovery, and authz/surface gap analysis (consolidated). |
| [`platform-and-api-benchmark-plan.md`](./platform-and-api-benchmark-plan.md) | Seeded benchmark case IDs (qualitative baselines). |
| [`context-aware-prioritization-plan.md`](./context-aware-prioritization-plan.md) | Future prioritization design. |
| [`webhook-verification-rule-proposal.md`](./webhook-verification-rule-proposal.md) | Webhook signature rule (v2 ideas; aligns with `WEBHOOK-001`). |

## Regenerate the QR (if the public URL changes)

Poster, handout, and `qr-github.svg` currently target **`https://github.com/Joshober/cybersecurity-scanner`**.

**PowerShell (downloads SVG from a public API):**

```powershell
$url = "https://github.com/Joshober/cybersecurity-scanner"  # change if the repo moves
$enc = [uri]::EscapeDataString($url)
Invoke-WebRequest -Uri "https://api.qrserver.com/v1/create-qr-code/?size=116x116&data=$enc&format=svg" -OutFile qr-raw.svg
```

Then edit `qr-raw.svg`: set background rect to `fill:#0a0a0f` and module path to `fill:#ffffff`, matching the current `qr-github.svg` styling—or keep high-contrast black-on-white for print if your chair prefers it.

**With Node (if installed):**

```bash
npx qrcode -t svg -o qr-github.svg "https://github.com/Joshober/cybersecurity-scanner"
```

Adjust colors in the SVG to match the poster if needed.

## Final PDF

1. Open `vibescan-research-poster.html` in Chrome/Edge.
2. Print → **Save as PDF** → filename **`vibescan-poster-FINAL.pdf`**.
3. Zoom to ~25–50% to sanity-check legibility before sending to the poster chair.

## Notes to keep current

- Keep the DVNA comparison table aligned with `results/dvna-evaluation.md` and the latest run artifacts in `benchmarks/results/`.
- Update poster rule-count callouts if the scanner rule inventory changes.
