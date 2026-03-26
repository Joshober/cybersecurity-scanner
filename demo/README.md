# VibeScan Interactive Demo

This interactive website clones a selected GitHub repository, optionally applies a deterministic “simulated hacked commit”, runs VibeScan, and shows whether the scan **blocks** the change (based on critical/high findings).

## Prereqs

- Node 18+
- `git` installed and available on PATH

## Setup

1. Build the scanner (required so the demo can import from `vibescan/dist/`):
   - From repo root: `npm run build` (or `npm run build -w vibescan`)
2. Start the demo server:
   - `node demo/server.mjs`
3. Open:
   - `http://localhost:3000/`

## Safety notes

- The server only accepts `https://github.com/<owner>/<repo>` URLs.
- Clones are written to `demo/.tmp/` (not committed).

## How “blocked” works

The server returns `blocked: true` when any VibeScan finding has severity `critical` or `error`.

