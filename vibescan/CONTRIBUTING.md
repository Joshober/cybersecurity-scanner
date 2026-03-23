# Contributing to VibeScan

## Add a rule

1. Create `src/rules/<category>/<name>.js` exporting an object:

   - `id` — stable rule id (e.g. `RULE-…`)
   - `cwe`, `owasp`, `severity`
   - `detect(ctx)` — returns an array of findings (`ruleId`, `message`, `file`, `line`, `severity`, optional `snippet`, `cwe`, `owasp`)

2. Use `forEachParsedFile(ctx, …)` from [src/rules/utils.js](src/rules/utils.js) for whole-file AST walks, or iterate `ctx.routes` for route/middleware-aware checks.

3. Register the rule in [src/rules/index.js](src/rules/index.js).

4. Add or extend a fixture under `tests/fixtures/` and a Jest test if behavior should be locked in.

5. Update [RULES.md](RULES.md) with a one-row summary.

## Style

- ESM, `.js` paths with explicit extensions in imports.
- Match existing naming and severity choices; prefer focused patterns over catch-all heuristics.

## PR checklist

- `npm test` passes.
- `node src/cli.js scan tests/fixtures/vulnerable-express-app` runs without throwing.
