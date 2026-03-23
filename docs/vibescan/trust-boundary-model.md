# Trust boundary model (Node / Express)

This model supports **design and evaluation** of VibeScan. It is not a formal verification framework.

## Unauthenticated users (public internet)

**Risks:** Mass assignment, injection, abuse of signup/login/reset, scraping, webhook spoofing if verification is weak.

**VibeScan can detect (heuristic):** Injection/crypto patterns in handlers; missing recognizable rate limits on path patterns deemed sensitive; webhook routes lacking signature-related hints in the **same** handler source; missing CSRF hints on state-changing routes (high false-positive risk for API-only apps).

**Limits:** Cannot know if TLS, WAF, or edge auth protects the route.

## Authenticated users (session / token holders)

**Risks:** IDOR/BOLA, broken function-level authorization, excessive data exposure.

**VibeScan can detect (heuristic):** Routes with no recognizable auth middleware in the **extracted** chain (see `middlewareAudit`); cannot verify **object-level** checks (`userId` vs `req.user.id`).

**Limits:** Auth may live in a parent mount file or framework plugin not modeled; role checks are invisible to string-based middleware matching.

## Admins / moderators

**Risks:** Privilege escalation, destructive moderation actions without audit trails.

**VibeScan can detect (heuristic):** `AUTH-004`-class findings for path patterns resembling admin/moderation surfaces without recognizable auth middleware.

**Limits:** Admin APIs under generic paths (`/api/v1/action`) are not covered by path heuristics alone.

## Internal services (service-to-service)

**Risks:** Trusting internal network without authentication; SSRF to internal URLs.

**VibeScan can detect:** SSRF-sink-oriented rules where implemented; not a full network trust model.

**Limits:** No visibility into VPC layout or mTLS configuration.

## Third-party APIs (outbound)

**Risks:** SSRF, secret leakage, insecure TLS options.

**VibeScan can detect:** Patterns in code (e.g., disabled TLS, weak crypto) where rules exist.

**Limits:** Runtime redirect behavior and API gateway policies are out of scope.

## Webhooks / payments callbacks

**Risks:** Forged events, replay, amount tampering if verification is skipped.

**VibeScan can detect (heuristic):** `WEBHOOK-001` when path and body use suggest webhooks but common verification tokens are absent **in handler text** (split modules reduce recall).

**Limits:** Raw-body parsing and provider SDK usage in other files may produce false negatives.

## File uploads

**Risks:** Unrestricted type/size, path traversal on stored files, malware hosting.

**VibeScan can detect:** Path/upload-related injection rules where applicable; sensitive path tagging for `/upload`-style routes for rate-limit heuristics.

**Limits:** Content validation and storage isolation are not proven statically.

## Environment / configuration

**Risks:** Secret defaults, debug flags in production, permissive CORS.

**VibeScan can detect:** Hardcoded secrets, weak JWT secrets, env fallbacks, some app-level patterns (`appLevelAudit`).

**Limits:** Actual deployment env values are not read at scan time unless explicitly integrated (future work).
