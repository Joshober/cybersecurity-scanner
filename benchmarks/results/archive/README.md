# Archive pointer — layout history

Evaluation prose and captured tool output for DVNA originally lived at repo-root `results/`. That content now lives under **[`../legacy/`](../legacy/)** (same files, new path).

| Path | Role |
|------|------|
| [`../legacy/dvna-evaluation.md`](../legacy/dvna-evaluation.md) | Methodology + preliminary comparison table |
| [`../legacy/vibescan-dvna.txt`](../legacy/vibescan-dvna.txt) | VibeScan JSON/text capture |
| [`../legacy/eslint-dvna.txt`](../legacy/eslint-dvna.txt) | ESLint capture |
| [`../legacy/npm-audit-dvna.txt`](../legacy/npm-audit-dvna.txt) | npm audit |
| [`../legacy/bearer-dvna.txt`](../legacy/bearer-dvna.txt) | Bearer reproducibility (or “not run”) |

When publishing paper-grade runs, copy (or symlink) relevant files into a dated folder under [`../`](../) and attach a completed `manifest.json`.
