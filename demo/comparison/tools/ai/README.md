# AI workflow (semi-automated)

Do **not** assume a stable API here. For each case:

1. Use `cases/<id>/prompt.md` with Claude Code (or another assistant).
2. Paste findings / proposed fix into `results/<YYYY-MM-DD>/<id>/ai.json` using `result.template.json` as a schema guide.

The harness **merges** existing `ai.json` files into `summary-table.*`; it does not call cloud APIs.
