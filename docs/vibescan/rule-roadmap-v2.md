# Rule roadmap v2

Rules grouped by **effort**. “**Exists**” marks current implementation status.

## Easy

| Rule / capability | Notes |
|-------------------|--------|
| Missing auth on admin/mod routes (`AUTH-004`) | **Exists** — `middlewareAudit.ts` + `adminPaths.ts` |
| Missing rate limit on sensitive routes (`MW-002`) | **Exists** — extend patterns/names cautiously |
| Insecure CORS defaults | Partially overlaps app-level patterns; dedicated rule TBD |
| Endpoint inventory export | **Exists** — `routeInventory` in project JSON + `--export-routes` |

## Medium

| Rule / capability | Notes |
|-------------------|--------|
| Narrow `AUTH-003` to sensitive surfaces | **Done in roadmap execution** — reduces noise |
| Missing audit logging on sensitive actions | New heuristic; needs FP budget |
| Unsafe webhook verification (`WEBHOOK-001`) | **Exists** — proposal doc for v2 (raw body, imports) |
| Route sensitivity classification | **Exists** as tags on inventory; refine lists over time |

## Hard

| Rule / capability | Notes |
|-------------------|--------|
| Spec drift detection | OpenAPI parse + diff vs `routeInventory` |
| Authz abuse test generation | Requires flow or policy model; research-heavy |
| Context-aware prioritization | Deployment/build correlation (see `context-aware-prioritization-plan.md`) |
| Full mount-prefix resolution across files | CFG/symbol work |

## Suggested next implementations (after roadmap)

1. CORS-specific rule with conservative triggers.
2. Audit-log presence heuristic on POST/PUT/PATCH/DELETE + sensitive tag.
3. OpenAPI diff (prototype on single-file spec).
