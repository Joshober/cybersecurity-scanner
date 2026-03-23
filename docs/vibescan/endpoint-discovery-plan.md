# Endpoint discovery plan (Express / Node)

## Goals

- **Route inventory:** List HTTP methods and paths reachable from static analysis.
- **Middleware chain discovery:** Names (or identifiers) of middleware passed before the final handler, when expressed as call arguments.
- **Sensitive route tagging:** Classify routes with heuristics (admin, auth, upload, webhook, messaging, etc.).
- **Auth middleware detection:** Match middleware identifiers against a conservative allowlist (see `middlewareNames.ts`).
- **Rate-limit middleware detection:** Same pattern for common limiter identifiers.
- **Undocumented route vs spec (future):** When an OpenAPI document is available, diff **discovered** routes against the spec (out of scope until spec ingestion exists).

## Current implementation (baseline)

[`src/system/parser/routeGraph.ts`](../../src/system/parser/routeGraph.ts) extracts routes from a single file’s AST when:

- An Express `app` or `Router` instance is recognized.
- HTTP verbs are called with **string-literal** (or inferable) path segments.
- Middleware names are taken from **direct** arguments to `app.get/post/...` (identifiers or simple member expressions).

[`scanProject`](../../src/system/scanner.ts) merges per-file `RouteNode[]` for project-level audits.

## Gaps and limitations

| Topic | Limitation |
|-------|------------|
| Dynamic paths | Template strings, variables, or computed paths are not resolved. |
| Mount prefixes | Routers `app.use('/api', router)` require cross-file mount resolution; current graph is **per-file** path segments merged without full mount closure in all cases. |
| Frameworks | Fastify, Nest, Hapi, etc., are not modeled. |
| Auth in wrappers | `app.post(p, policies.isUser, handler)` depends on naming; custom wrappers may be missed. |
| Split handlers | Verification logic in imported modules is invisible to webhook heuristics that only read `handlerSource`. |

## Planned enhancements (incremental)

1. **Route inventory export** — Structured JSON with `method`, `fullPath`, `file`, `line`, `middlewares`, and **tags** derived from path heuristics (implemented alongside formatter/CLI).
2. **Mount resolution (medium)** — Track `app.use(prefix, router)` when both are in the same file; extend to multi-file with a symbol table (harder).
3. **Spec drift (hard)** — Parse OpenAPI/Swagger path keys; report routes in code not in spec and vice versa.
4. **Sensitivity ML/heuristics (optional)** — Expand regex lists cautiously; prefer precision over recall.

## Non-goals (near term)

- Full call-graph or points-to analysis.
- Automatic proof of authentication or role enforcement.
