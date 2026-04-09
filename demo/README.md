# VibeScan Interactive Demo

This interactive website clones a selected GitHub repository, optionally applies a deterministic “simulated hacked commit”, runs VibeScan, and shows whether the scan **blocks** the change (based on critical/high findings).

## Prereqs

- Node 18+
- `git` installed and available on PATH

## Setup

1. From the `demo/` folder, install dependencies (uses published `@jobersteadt/vibescan`):
   - `npm install`
2. Start the demo server:
   - `node server.mjs`
3. Open:
   - `http://localhost:3000/` — marketing landing (how VibeScan works)
   - `http://localhost:3000/try` — interactive clone + scan demo
   - `http://localhost:3000/scan/<scanId>` — permalink to a completed scan (same UI as `/try`)

## Safety notes

- The server only accepts `https://github.com/<owner>/<repo>` URLs.
- Clones are written to `demo/.tmp/` (not committed).

## How “blocked” works

The server returns `blocked: true` when any VibeScan finding has severity `critical` or `error`.

