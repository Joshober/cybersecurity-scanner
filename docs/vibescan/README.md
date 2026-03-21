# VibeScan — conference materials (Person B)

Assets for poster, abstract, pitch, handout, and QR code. Open HTML files in a browser; print to PDF when ready.

| File | Purpose |
|------|---------|
| [`vibescan-research-poster.html`](./vibescan-research-poster.html) | Main research poster (dark theme, cards, DVNA table TBD). |
| [`qr-github.svg`](./qr-github.svg) | 120×120-style QR (white modules on `#0a0a0f`) for placeholder URL `https://github.com/YOUR-USERNAME/vibescan`. |
| [`abstract.md`](./abstract.md) | Paste-up abstract + citation checklist. |
| [`pitch-60s.md`](./pitch-60s.md) | 60s script + six judge cue cards. |
| [`handout.html`](./handout.html) | A5 handout; print in grayscale to verify contrast. |
| [`SUBMISSION-CHECKLIST.md`](./SUBMISSION-CHECKLIST.md) | Logistics (form, chair, deadlines). |

## Regenerate the QR for your real repo URL

Replace `YOUR-USERNAME` everywhere (poster, handout, abstract if needed), then regenerate `qr-github.svg`:

**PowerShell (downloads SVG from a public API):**

```powershell
$url = "https://YOUR-ACTUAL-REPO-URL"  # e.g. https://github.com/org/vibescan
$enc = [uri]::EscapeDataString($url)
Invoke-WebRequest -Uri "https://api.qrserver.com/v1/create-qr-code/?size=116x116&data=$enc&format=svg" -OutFile qr-raw.svg
```

Then edit `qr-raw.svg`: set background rect to `fill:#0a0a0f` and module path to `fill:#ffffff`, matching the current `qr-github.svg` styling—or keep high-contrast black-on-white for print if your chair prefers it.

**With Node (if installed):**

```bash
npx qrcode -t svg -o qr-github.svg "https://github.com/YOUR-USERNAME/vibescan"
```

Adjust colors in the SVG to match the poster if needed.

## Final PDF

1. Open `vibescan-research-poster.html` in Chrome/Edge.
2. Print → **Save as PDF** → filename **`vibescan-poster-FINAL.pdf`**.
3. Zoom to ~25–50% to sanity-check legibility before sending to the poster chair.

## Person A inputs to merge

- DVNA table numbers (poster + abstract + pitch).
- Final public GitHub URL and rule count (optional poster line).
