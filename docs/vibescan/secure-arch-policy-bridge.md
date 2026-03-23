# VibeScan ↔ secure-arch policy bridge

This workflow uses a small **policy file** that states architectural security expectations, maps them to **VibeScan rule IDs**, and fails CI when code violates those expectations.

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
| `publicDatabaseDisallowed` | `ARCH-DB-001` | Reserved for secure-arch correlated findings when present in scan payload |
| `strongSecretsRequired` | `SEC-004`, `crypto.secrets.hardcoded`, `crypto.jwt.weak-secret-literal`, `crypto.jwt.weak-secret-verify`, … | Several crypto rules |
| `loggingRequiredOnSensitiveActions` | *(gap)* | Needs taint/route bridge |
| `corsWildcardDisallowed` | `MW-004` | `cors({ origin: '*' })` |

## Production usage

1. Run `vibescan scan` with JSON output:

   ```bash
   node vibescan/dist/system/cli/index.js scan ./src --format json > scan.json
   ```

2. Evaluate with explicit policy:

   ```bash
   node vibescan/scripts/policy-eval.mjs docs/samples/policy.sample.json scan.json
   ```

3. Or derive policy flags from secure-arch settings:

   ```bash
   node vibescan/scripts/policy-eval.mjs --from-settings architecture/secure-rules/settings.global.yaml scan.json
   ```

4. The script exits non-zero when violations are present and prints totals + per-policy counts.

## Relation to secure-arch YAML

[`packages/secure-arch-core`](../../packages/secure-arch-core/) loads `architecture/secure-rules/*.yaml` into **ArchitectureFacts**. The policy evaluator now supports `--from-settings` to derive policy booleans directly from secure-arch settings, so teams can reuse one source of truth in CI.

## Limitations

- Static route analysis cannot see auth applied in wrappers outside the extracted middleware chain.
- Webhook verification may be delegated; `WEBHOOK-001` is intentionally conservative and documented as such.
