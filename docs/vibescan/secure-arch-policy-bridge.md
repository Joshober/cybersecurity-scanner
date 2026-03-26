# VibeScan ↔ secure-arch policy bridge (design)

This document proposes a small **policy file** that states architectural security expectations, and maps them to **VibeScan rule IDs** so CI can fail when code violates declared policy.

## Policy schema (JSON or YAML)

```json
{
  "schemaVersion": "1",
  "authRequiredOnAdminRoutes": true,
  "rateLimitRequiredOnSensitiveRoutes": true,
  "webhookSignatureVerificationRequired": true,
  "publicDatabaseDisallowed": true,
  "strongSecretsRequired": true,
  "loggingRequiredOnSensitiveActions": false,
  "corsWildcardDisallowed": true
}
```

Boolean `true` means: **violations of this expectation fail the policy check** (see evaluation below).

## Mapping: policy flag → VibeScan rules

| Policy flag | Rule IDs | Notes |
|-------------|----------|--------|
| `authRequiredOnAdminRoutes` | `AUTH-004` | Admin/mod-style paths without auth middleware |
| `rateLimitRequiredOnSensitiveRoutes` | `MW-002` | Login, webhooks, upload, auth-like paths |
| `webhookSignatureVerificationRequired` | `WEBHOOK-001` | Heuristic; false negatives if verification lives in another module |
| `publicDatabaseDisallowed` | *(gap)* | Add future rule for public Mongo/Redis URLs |
| `strongSecretsRequired` | `SEC-004`, `crypto.secrets.hardcoded`, `crypto.jwt.weak-secret-literal`, … | Several crypto rules |
| `loggingRequiredOnSensitiveActions` | *(gap)* | Needs taint/route bridge |
| `corsWildcardDisallowed` | `MW-004` | `cors({ origin: '*' })` |

## Evaluation algorithm

1. Run `vibescan scan` with `--format json` (or consume `findings[]` from project JSON).
2. Load policy document.
3. For each policy key that is `true`, collect mapped rule IDs. Any finding whose `ruleId` is in that set is a **policy violation**.
4. Exit non-zero if any violation exists (or emit SARIF / adjudication CSV for review).

## Relation to secure-arch YAML

[`vibescan/packages/secure-arch-core`](../../vibescan/packages/secure-arch-core/) loads `architecture/secure-rules/*.yaml` into **ArchitectureFacts**. A future step is to **generate** the JSON policy above from those facts (or merge both in one CI job). This repo keeps the PoC as **standalone JSON** so it runs without building secure-arch.

## Limitations

- Static route analysis cannot see auth applied in wrappers outside the extracted middleware chain.
- Webhook verification may be delegated; `WEBHOOK-001` is intentionally conservative and documented as such.
