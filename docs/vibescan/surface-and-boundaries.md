# Surface, trust boundaries, and authorization gaps (Node/Express)

This document consolidates three related notes into one: the trust-boundary model, endpoint discovery plan, and an honest authz/surface gap analysis. It supports design and evaluation of VibeScan; it is not a formal verification framework.

## Trust boundary model (Node / Express)

### Unauthenticated users (public internet)

- **Risks**: injection, abuse of signup/login/reset, scraping, webhook spoofing if verification is weak.
- **VibeScan can detect (heuristic)**: injection/crypto patterns in handlers; missing recognizable rate limits on sensitive path patterns; webhook-like routes lacking signature-related hints in the same handler source; missing CSRF hints on state-changing routes (high false-positive risk for API-only apps).
- **Limits**: cannot know whether TLS/WAF/edge auth protects the route.

### Authenticated users (session/token holders)

- **Risks**: IDOR/BOLA, broken function-level authorization, excessive data exposure.
- **VibeScan can detect (heuristic)**: absence of recognizable auth middleware in the extracted chain (`middlewareAudit`); cannot verify object-level checks (`userId` vs `req.user.id`).
- **Limits**: auth may live in parent mounts or frameworks not modeled; role checks may be invisible to identifier matching.

### Admins / moderators

- **Risks**: privilege escalation, destructive actions without audit trails.
- **VibeScan can detect (heuristic)**: `AUTH-004`-class findings for admin/moderation-like path patterns without recognizable auth middleware.
- **Limits**: admin APIs under generic paths are not covered by path heuristics alone.

### Internal services (service-to-service)

- **Risks**: implicit network trust; SSRF to internal URLs.
- **VibeScan can detect**: SSRF-sink-oriented rules where implemented; not a full network trust model.
- **Limits**: no visibility into network/mTLS/VPC configuration.

### Third-party APIs (outbound)

- **Risks**: SSRF, secret leakage, insecure TLS options.
- **VibeScan can detect**: patterns in code where rules exist (e.g., disabled TLS, weak crypto).
- **Limits**: runtime redirect behavior and gateway policies are out of scope.

### Webhooks / payments callbacks

- **Risks**: forged events, replay, tampering if verification is skipped.
- **VibeScan can detect (heuristic)**: `WEBHOOK-001` when path and body use suggest a webhook but common verification markers are absent in handler text.
- **Limits**: verification delegated to imports reduces recall.

### File uploads

- **Risks**: unrestricted type/size, path traversal, malware hosting.
- **VibeScan can detect**: path/upload-related rules where applicable; sensitive path tagging for rate-limit heuristics.
- **Limits**: content validation/storage isolation are not proven statically.

### Environment / configuration

- **Risks**: secret defaults, debug flags in production, permissive CORS.
- **VibeScan can detect**: hardcoded secrets, weak JWT secrets, env fallbacks, some app-level patterns (`appLevelAudit`).
- **Limits**: actual deployment env values are not read at scan time unless explicitly integrated.

## Endpoint discovery plan (Express / Node)

### Goals

- Route inventory: list methods/paths reachable from static analysis.
- Middleware chain discovery: identifiers passed before the final handler (when present as direct arguments).
- Sensitive route tagging: admin/auth/upload/webhook/etc. based on conservative heuristics.
- Auth/rate-limit middleware detection: match middleware identifiers against conservative allowlists.

### Current implementation (baseline)

- `src/system/parser/routeGraph.ts` extracts routes from a single file’s AST when Express `app`/`Router` is recognized, verbs are called with inferable literal paths, and middleware identifiers appear as direct arguments.
- `scanProject` in `src/system/scanner.ts` merges per-file routes for project-level audits.

### Gaps and limitations

| Topic | Limitation |
|-------|------------|
| Dynamic paths | template strings/variables/computed paths are not resolved |
| Mount prefixes | router mount closure is incomplete across files in many cases |
| Frameworks | non-Express frameworks are not modeled |
| Auth in wrappers | custom wrappers may be missed without recognizable identifiers |
| Split handlers | verification logic in imported modules is invisible to heuristics that only inspect handler source |

### Planned enhancements (incremental)

1. Route inventory export: structured JSON with `method`, `fullPath`, `file`, `line`, `middlewares`, and tags.
2. Mount resolution: same-file `app.use(prefix, router)` first; multi-file later (harder).
3. Spec drift: OpenAPI/Swagger ingest and diff (code vs spec).
4. Sensitivity heuristics: expand conservatively (prefer precision over recall).

### Non-goals (near term)

- Full call-graph / points-to analysis.
- Automatic proof of authentication/authorization or role enforcement.

## Authorization and attack surface gaps (detects vs misses)

### IDOR / BOLA (broken object-level authorization)

- **Detects well**: not at the object level; VibeScan does not compare resource IDs to user identity.
- **Misses**: nearly all true IDOR/BOLA without additional modeling.
- **Partial proxy**: `AUTH-003` suggests missing route-level auth middleware on certain sensitive paths (not the same failure mode).

### Broken function-level authorization

- **Detects (heuristic)**: missing recognizable auth middleware on sensitive state-changing routes (`AUTH-003`, `AUTH-004`).
- **Misses**: authorization inside handler bodies, role checks in separate files.

### Undocumented endpoints / spec drift

- **Detects**: statically extracted Express routes appear in JSON output (`routes` / `routeInventory`).
- **Misses**: dynamic registration, non-Express frameworks, gateway-defined routes.
- **Spec drift**: requires spec ingest and diff; treat as its own evaluated slice.

### Missing rate limits

- **Detects (heuristic)**: `MW-002` on sensitive path patterns without recognizable rate-limit middleware on state-changing methods.
- **Misses**: rate limiting enforced at reverse proxy/edge, or custom limiter names.

### Webhook verification

- **Detects (heuristic)**: `WEBHOOK-001` for webhook-like paths and body use without common verification hints in handler source.
- **Misses**: delegated verification, non-POST patterns, non-matching paths.

### CSRF

- **Detects (heuristic)**: `MW-001` flags missing CSRF hints on state-changing routes; may false-positive on token-only APIs.

### Summary table

| Area | Rule(s) / feature | Strength | Weakness |
|------|---------------------|----------|----------|
| Route surface | `routes`, route inventory | literal Express routes | dynamic paths, mounts |
| Admin auth gap | `AUTH-004` | path + middleware chain | generic paths, global auth |
| Sensitive auth gap | `AUTH-003` | same | narrowed to reduce noise |
| Rate limit gap | `MW-002` | sensitive paths | edge limiters, unknown names |
| Webhook verification | `WEBHOOK-001` | obvious omissions in handler | split modules |
| IDOR / BOLA | — | — | not modeled |
| Audit logging | — | — | not implemented |

