# Authorization and attack surface — what VibeScan detects vs misses

This is an **honest** gap analysis for research and product planning. Rule IDs refer to the current middleware/webhook audits unless noted.

## IDOR / BOLA (broken object-level authorization)

**Detects well:** Nothing at the **object** level. VibeScan does not compare resource IDs in handlers to `req.user`.

**Misses:** Nearly all true IDOR/BOLA without additional taint/role modeling.

**Partial proxy:** `AUTH-003` (restricted to sensitive/admin-like paths in current direction) suggests **missing route-level auth middleware**—a different failure mode than IDOR.

## Broken function-level authorization

**Detects well:** Heuristic absence of recognizable **auth** middleware on **state-changing** routes that match sensitivity heuristics (`AUTH-003`, `AUTH-004`).

**Misses:** Handlers that call `authorize('admin')` inside the body without appearing in the middleware chain; role checks in separate files.

## Undocumented endpoints

**Detects well:** Statically extracted Express routes appear in JSON output (`routes` / `routeInventory`).

**Misses:** Dynamic registration, non-Express frameworks, routes only defined in config or gateways.

**Future:** Spec drift detection when OpenAPI is supplied.

## Spec drift

**Detects:** Not yet (requires spec ingestion and diff).

## Missing auth on sensitive routes

**Detects:** `AUTH-004` for admin/moderation-style path patterns without auth middleware; `AUTH-003` for other **sensitive** path patterns (post-restriction) on POST/PUT/PATCH/DELETE.

**Misses:** Sensitive business operations under benign-looking paths; auth via global middleware not attributed to the route in the extractor.

## Missing rate limits

**Detects:** `MW-002` for sensitive path patterns without recognizable rate-limit middleware on state-changing methods.

**Misses:** Rate limiting at reverse proxy, edge, or API gateway; custom limiter names outside the list.

## Missing audit logging

**Detects:** No dedicated rule today.

**Future:** Optional heuristic for sensitive mutations without `log`/`audit`/`logger` references (high false-positive risk—needs careful design).

## Webhook verification

**Detects:** `WEBHOOK-001` for webhook-like paths and body use without common verification hints in **handler** source.

**Misses:** Verification delegated to imported functions; non-POST patterns; paths that do not match hints.

## CSRF

**Detects:** `MW-001` flags missing CSRF-related middleware on state-changing routes (may false-positive for token APIs).

## Summary table

| Area | Rule(s) / feature | Strength | Weakness |
|------|---------------------|----------|----------|
| Route surface | `routes`, route inventory | Literal Express routes | Dynamic paths, mounts |
| Admin auth gap | `AUTH-004` | Path + middleware chain | Generic paths, global auth |
| Sensitive auth gap | `AUTH-003` | Same | Narrowed to reduce noise |
| Rate limit gap | `MW-002` | Sensitive paths | Edge limiters, unknown names |
| Webhook verification | `WEBHOOK-001` | Obvious omissions in handler | Split modules |
| IDOR / BOLA | — | — | Not modeled |
| Audit logging | — | — | Not implemented |
