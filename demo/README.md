# VibeScan Interactive Demo

This interactive website clones a selected GitHub repository, optionally applies a deterministic “simulated hacked commit”, runs VibeScan, and shows whether the scan **blocks** the change (based on critical/high findings).

## Prereqs

- Node 18+
- `git` installed and available on PATH

## Setup

1. Build the scanner (required so the demo can import from `vibescan/dist/`):
   - `npm run build -w vibescan`
2. Start the demo server:
   - `node demo/server.mjs`
3. Open:
   - `http://localhost:3000/`

## Example projects (bundled source)

- **`demo/examples/fashion-ai/`** — trimmed Fashion AI monorepo (no `node_modules`, `venv`, large model weights, or `.env`). Scan via GitHub: **Fashion AI** quick-pick or `https://github.com/Alvaromp3/fashion_ai`.
- **`demo/examples/NutrionMobileApp/`** — trimmed **Nutrion** mobile stack (Flutter + Java/Spring backend). `.git` and large ONNX weights under `models/` are omitted in the copy; use **Nutrion mobile app** or `https://github.com/Joshober/NutrionMobileApp` to scan the live repo.

The demo UI still **clones from GitHub** when you run a scan; the folders under `demo/examples/` are for local reference only.

## Safety notes

- The server only accepts `https://github.com/<owner>/<repo>` URLs.
- Clones are written to `demo/.tmp/` (not committed).

## How “blocked” works

The server returns `blocked: true` when any VibeScan finding has severity `critical` or `error`.

