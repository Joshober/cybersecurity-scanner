# LLM-oriented threats: what VibeScan tests vs what you must handle elsewhere

VibeScan is **static analysis for JavaScript/TypeScript** (crypto, injection, Express middleware, OpenAPI drift, optional npm registry checks). It does **not** run prompts against a model or audit training datasets.

Use this page to map common LLM attack categories to **repo tooling** and to **required non-scanner controls**.

## Layered program

| Layer | Examples |
|-------|-----------|
| **Static (this repo)** | `vibescan scan`, optional `--check-registry` (`SLOP-001`), workspace `npm audit`, policy-eval |
| **Model / data plane** | Red-team prompt suites, dataset governance, output filters, tool-call monitoring, human approval for sensitive tools |

## Category mapping

| Category | What “test/scan” means | In this repo |
|----------|------------------------|--------------|
| **Prompt injection** (direct/indirect) | Untrusted text mixed with instructions; RAG context smuggling | **Partial:** heuristic rules `injection.llm.dynamic-system-prompt`, `injection.llm.rag-template-mixing` (see rule list in root [README.md](../../README.md)). **Full:** adversarial eval against your deployed app ([`benchmarks/llm-redteam/`](../../benchmarks/llm-redteam/)). |
| **Data poisoning** | Bad training/fine-tune examples, provenance breaks | **Not SAST.** Use dataset signing, access control, and behavioral model tests outside VibeScan. |
| **Model inversion / PII leakage** | Memorized data extracted via probing; PII in outputs | **Partial:** hardcoded secrets / weak crypto rules; no memorization or probing tests. Use DP where appropriate, DLP on outputs, monitoring for abusive query patterns. |
| **Jailbreaking / output manipulation** | Policy bypass; gradual steering | **Not static** for pass/fail. **Partial:** unsafe rendering of model-generated text ([`injection.xss`](../../vibescan/src/attacks/browser/xss.ts), [`injection.llm.unsafe-html-output`](../../vibescan/src/attacks/injection/llm-integration.ts)). **Full:** model red-teaming. |
| **Tool abuse / overprivileged connectors** | Model invokes dangerous real-world actions | **Strong overlap:** command injection, `eval`, SSRF-style rules, weak auth heuristics (`injection.command`, `SSRF-003`, `RULE-SSRF-002`, `AUTH-*`). **Not a substitute** for least privilege, scoped credentials, rate limits, and approvals on tool calls. |
| **Supply chain** | Malicious or typosquat dependencies | **Partial:** `SLOP-001` with `--check-registry`; complement with `npm audit`, SBOM, and pinned versions ([`docs/vibescan/reproducible-runs.md`](./reproducible-runs.md)). |

## Practices VibeScan does not replace

- Sanitize and delimit **untrusted content** before it reaches the model; keep **system** and **retrieved** channels explicit.
- **Provenance** for datasets and prompts where possible.
- **Human-in-the-loop** for high-impact tool actions.
- **Output filtering** for PII/secrets before display or storage.
- **Regular red-team** cadence against production-like endpoints.

## Related docs

- [Rule coverage audit](./rule-coverage-audit.md) — tests, fixtures, rule IDs.
- [Seeded benchmark plan](./seeded-benchmark-plan.md) — SB cases tagged with LLM threat themes.
- [Secure-arch policy bridge](./secure-arch-policy-bridge.md) — optional CI policy flags including LLM integration rules.
