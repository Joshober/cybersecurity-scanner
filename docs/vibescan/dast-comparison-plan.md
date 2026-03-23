# DAST comparison plan (Burp, ZAP, nuclei, sqlmap)

## What each tool tests (summary)

| Tool | Primary lens |
|------|----------------|
| **Burp Suite** | Manual and semi-automated HTTP testing, session handling, extensions |
| **OWASP ZAP** | Automated spider/scan, passive/active rules against running apps |
| **nuclei** | Template-based scanning against known URLs/hostnames |
| **sqlmap** | SQL injection exploitation against parameters/endpoints |

## What VibeScan tests

- **Static** JavaScript/TypeScript (and optional npm registry) **without** requiring a running server.
- Express **route** and **middleware-chain** heuristics, AI-typical weak patterns, injection/crypto rules.

## Hybrid evaluation (recommended)

1. **Static pass:** VibeScan on repository (with `--exclude-vendor` for benchmarks).
2. **Inventory handoff:** Use `routeInventory` / JSON `routes` to seed DAST crawl lists (still subject to dynamic vs static path mismatch).
3. **Dynamic pass:** Burp/ZAP/nuclei against a **staged** deployment of the same commit.
4. **Adjudication:** Label findings by **root cause** (config vs code vs dependency) before comparing tools.

## Why DAST is future work, not main scope

- VibeScan’s core contribution is **early, local, static** signal and **research on LLM-generated backends**.
- Standing up reproducible DAST environments (auth, data, CI) is **high effort** and belongs in evaluation milestones, not in the default scanner path.
- Many static findings (e.g., hardcoded secrets) **do not require** HTTP traffic to validate existence; others (session bugs) **do**—report that split clearly.

## sqlmap specifically

Use only on **isolated lab targets** with permission. Useful to validate **specific** SQLi hypotheses; not a substitute for static taint reporting or for measuring total project security.
