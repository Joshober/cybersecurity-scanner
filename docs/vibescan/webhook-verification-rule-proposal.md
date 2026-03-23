# Webhook signature verification — rule proposal (v2)

## Current implementation

`WEBHOOK-001` in [`src/system/engine/webhookAudit.ts`](../../src/system/engine/webhookAudit.ts) flags **POST/PUT** routes whose path matches shared webhook hints ([`webhookPathHints.ts`](../../src/system/utils/webhookPathHints.ts)), whose handler references `req.body`, and whose **inline** handler source lacks common verification tokens (Stripe `constructEvent`, `timingSafeEqual`, signature headers, etc.).

**Limits:** Verification in imported modules is invisible; raw-body requirement is not modeled; false negatives when logic is delegated.

## Stripe-style safe patterns (examples)

- Use the provider SDK with the **raw** request body and secret (e.g. `stripe.webhooks.constructEvent(buf, sig, secret)`).
- Reject on missing or malformed signature headers before parsing JSON for side effects.
- Prefer **timing-safe** comparison for HMAC or signature bytes.

## Generic safe patterns

- Central `verifyWebhook(req)` that reads a dedicated header, recomputes HMAC over raw body, compares with `crypto.timingSafeEqual`.
- Middleware applied **before** business logic that trusts `req.body`.

## Risky patterns

- `JSON.parse(req.body)` or direct use of `req.body` for payment state updates with no signature check in the same compilation unit.
- Trusting `x-forwarded-*` or client-supplied IDs without provider verification.

## Keeping false positives low (v2 ideas)

1. **Require** webhook path hint **and** body use (already done).
2. **Allowlist** more provider tokens as they are identified; document in rule metadata.
3. **Optional:** resolve simple re-exports (`import { verify } from './webhook-verify'`) in the same package—high effort, use sparingly.
4. **Severity:** keep **warning** unless multiple signals (e.g., payment keywords + no `rawBody` middleware name in chain).

## Relation to research / product

Treat webhook rules as **assistive** for code review and benchmark seeding, not as proof that production webhooks are secure.
