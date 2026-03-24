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
  "corsWildcardDisallowed": true,
  "llmUnsafeIntegrationDisallowed": false
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
| `llmUnsafeIntegrationDisallowed` | `injection.llm.dynamic-system-prompt`, `injection.llm.rag-template-mixing`, `injection.llm.unsafe-html-output` | Heuristic LLM integration patterns; see [`llm-threat-coverage.md`](./llm-threat-coverage.md) |

`--from-settings` leaves `llmUnsafeIntegrationDisallowed` **false** unless you add it explicitly to your policy JSON when not using derived settings alone.

## Explicit deny list (`denyRuleIds`)

Policy files may include **`denyRuleIds`**: an array of `ruleId` strings. If **any** VibeScan finding matches, [`policy-check.mjs`](../../vibescan/scripts/policy-check.mjs) fails (merge gate). Use this when architectural booleans are not enough—for example “never ship SQL concat findings.”

Example: [`docs/samples/policy.deny-rules.json`](../samples/policy.deny-rules.json).

## Production usage

1. Run `vibescan scan` with JSON output:

   ```bash
   node vibescan/dist/system/cli/index.js scan ./path/to/your/app --format json > scan.json
   ```

2. **CI gate (human-readable stderr + JSON):**

   ```bash
   node vibescan/scripts/policy-check.mjs docs/samples/policy.sample.json scan.json
   ```

3. Evaluate with explicit policy (JSON summary on stdout only):

   ```bash
   node vibescan/scripts/policy-eval.mjs docs/samples/policy.sample.json scan.json
   ```

4. Or derive policy flags from secure-arch settings:

   ```bash
   node vibescan/scripts/policy-check.mjs --from-settings architecture/secure-rules/settings.global.yaml scan.json
   ```

5. The scripts exit non-zero when violations are present. Use **`policy-check`** in pipelines; use **`policy-eval`** when you only need machine-readable output without the stderr narrative.

**npm (workspace root):** `npm run policy-check -- docs/samples/policy.sample.json scan.json`

## Relation to secure-arch YAML

[`packages/secure-arch-core`](../../packages/secure-arch-core/) loads `architecture/secure-rules/*.yaml` into **ArchitectureFacts**. The policy evaluator now supports `--from-settings` to derive policy booleans directly from secure-arch settings, so teams can reuse one source of truth in CI.

## Limitations

- Static route analysis cannot see auth applied in wrappers outside the extracted middleware chain.
- Webhook verification may be delegated; `WEBHOOK-001` is intentionally conservative and documented as such.
