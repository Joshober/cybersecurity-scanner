# AI security review prompt (manual / Claude Code)

**Scope:** Only the files under `vulnerable/` in this case folder. This is a synthetic benchmark snippet, not a production app.

**Ask the model to:**

1. List concrete security issues in the Express route(s).
2. Cite line-level evidence for SQL injection or unsafe query construction.
3. Propose a minimal fix (parameterized query or ORM-safe pattern).
4. Say whether the issue is exploitable in this toy app and what is unknown without runtime context.

**Record in `results/<date>/01-sql-injection/ai.json`:** tool name, model/version, this prompt (or path), timestamp, raw findings text, and optional proposed patch.
