# LLM red-team harness (behavioral)

This folder is for **runtime** checks against a **deployed chat or completion API**—not for VibeScan static analysis.

VibeScan cannot execute prompts or measure jailbreak success; use this harness (or your own eval platform) for:

- Prompt injection and jailbreak attempts (policy bypass)
- Output manipulation probes (manual or scripted review of responses)

## Setup

1. Copy `.env.example` to `.env` and set `REDFLAGS_LLM_ENDPOINT` and `REDFLAGS_LLM_API_KEY` (or equivalent—adjust `run-redteam.mjs` to match your API shape).
2. Never commit real secrets or production URLs.

## Usage

```bash
node benchmarks/llm-redteam/run-redteam.mjs
```

The script reads [`prompts.adversarial.jsonl`](./prompts.adversarial.jsonl) (one JSON object per line: at minimum `{ "id", "prompt" }`), POSTs each prompt to your endpoint, and prints status plus a truncated response for human or downstream review.

## Safety

Run only against **test** services. Some prompts are intentionally adversarial. Log and review outputs under your org’s responsible disclosure and privacy rules.

## Related

- Static / code-side mapping: [`docs/vibescan/llm-threat-coverage.md`](../../docs/vibescan/llm-threat-coverage.md)
