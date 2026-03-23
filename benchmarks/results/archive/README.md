# Archive pointer — pre-`benchmarks/results/` layout

Evaluation prose and captured tool output for DVNA lived under [`../../../results/`](../../../results/) before the `benchmarks/` tree was added.

| Legacy path | Role |
|-------------|------|
| [`results/dvna-evaluation.md`](../../../results/dvna-evaluation.md) | Methodology + preliminary comparison table |
| [`results/vibescan-dvna.txt`](../../../results/vibescan-dvna.txt) | VibeScan JSON/text capture |
| [`results/eslint-dvna.txt`](../../../results/eslint-dvna.txt) | ESLint capture |
| [`results/npm-audit-dvna.txt`](../../../results/npm-audit-dvna.txt) | npm audit |
| [`results/bearer-dvna.txt`](../../../results/bearer-dvna.txt) | Bearer reproducibility (or “not run”) |

When publishing paper-grade runs, copy (or symlink) relevant files into a dated folder under [`../`](../) and attach a completed `manifest.json`.
