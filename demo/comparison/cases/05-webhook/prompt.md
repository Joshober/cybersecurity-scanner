# AI security review prompt (manual / Claude Code)

**Scope:** `vulnerable/` only.

**Ask:** Whether the webhook handler verifies provider signatures (e.g. Stripe `stripe-signature`, HMAC, timestamp tolerance). Cite missing checks.

**Save to** `results/<date>/05-webhook/ai.json`.
