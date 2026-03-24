# AI security review prompt (manual / Claude Code)

**Scope:** Files under `vulnerable/` only (synthetic benchmark).

**Ask:**

1. Identify path traversal or unsafe file read patterns from user-controlled input.
2. Reference `path.join`, `fs.readFile`, or similar with evidence.
3. Propose a safe resolution (allowlist, `path.resolve` + prefix check, or API change).
4. Note any false confidence (e.g. if base path is fully controlled).

**Save capture to** `results/<date>/02-path-traversal/ai.json`.
