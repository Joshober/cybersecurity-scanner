# VibeScan — conference materials (Person B)

Assets for poster, abstract, pitch, handout, and QR code. Open HTML files in a browser; print to PDF when ready.

| File | Purpose |
|------|---------|
| [`../REPO-HANDOFF.md`](../REPO-HANDOFF.md) | **Codebase / architecture summary** for collaborators or LLMs (pipeline, paths, what’s implemented). |
| [`../research-strengthening/README.md`](../research-strengthening/README.md) | **Academic spine:** RQ, methodology, evaluation, seeded plan, metrics, `Jober/NewLayout` merge strategy. |
| [`vibescan-research-poster.html`](./vibescan-research-poster.html) | Main research poster (dark theme, cards, DVNA table per `results/dvna-evaluation.md`). |
| [`qr-github.svg`](./qr-github.svg) | 120×120-style QR (white modules on `#0a0a0f`) for `https://github.com/Joshober/cybersecurity-scanner`. |
| [`abstract.md`](./abstract.md) | Paste-up abstract + citation checklist. |
| [`pitch-60s.md`](./pitch-60s.md) | 60s script + six judge cue cards. |
| [`handout.html`](./handout.html) | A5 handout; print in grayscale to verify contrast. |
| [`SUBMISSION-CHECKLIST.md`](./SUBMISSION-CHECKLIST.md) | Logistics (form, chair, deadlines). |
| [`rubric-status-updated.md`](./rubric-status-updated.md) | CCSC-style rubric vs **current** repo (DVNA numbers, gaps, fixes). |
| [`judge-prep-score-and-sources.md`](./judge-prep-score-and-sources.md) | **Score band**, **source tiers** (peer-reviewed vs industry), QR/repo credibility, rehearsal notes. |
| [`research-framing.md`](./research-framing.md) | **Research question, novelty, baselines, safe claims**, six deliverables checklist—turn “scanner + stats” into “evaluated method.” |
| [`evaluation-implementation-checklist.md`](./evaluation-implementation-checklist.md) | **Master tracker** for benchmark + adjudication work; links all evaluation docs below. |
| [`rule-coverage-audit.md`](./rule-coverage-audit.md) | Rules × unit tests, fixtures, README, benchmark relevance. |
| [`benchmark-layout.md`](./benchmark-layout.md) | Proposed `benchmarks/{dvna,seeded,results,scripts}/` layout. |
| [`reproducible-runs.md`](./reproducible-runs.md) | Scripts / pseudocode: build scanner, VibeScan, ESLint, npm audit, Bearer. |
| [`benchmark-manifest-template.json`](./benchmark-manifest-template.json) | Run metadata template (copy per experiment). |
| [`adjudication-template.md`](./adjudication-template.md) | Per-finding ground-truth labeling table. |
| [`output-support-audit.md`](./output-support-audit.md) | Where to add JSON summaries (format layer). |
| [`eval-support-changes.md`](./eval-support-changes.md) | Smallest non-detection code changes for eval ergonomics. |

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

## Person A inputs to merge

- **Bearer** row on the poster (optional): run and update from `results/bearer-dvna.txt`.
- Rule count on the poster if the frozen inventory changes (optional).
