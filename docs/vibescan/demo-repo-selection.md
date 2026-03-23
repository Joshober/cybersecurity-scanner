# VibeScan Demo Repo Selection

## Goal
Build a *safe* conference demo set for VibeScan using intentionally vulnerable *local* apps, while still anchoring evaluation against known benchmark code.

This doc explains why the demo set should use a mix of:

- One external vulnerable Node app repository (secondary benchmark).
- DVNA as the primary benchmark (already established in this repo).
- Several tiny seeded local apps (exact showcase cases you control end-to-end).

## Why mix external vulnerable repos and local seeded demos
External vulnerable repos help you avoid “benchmarks that only match a toy pattern.” Real repositories:

1. Contain realistic variability (route layout, helpers, data shapes, file naming, auth wiring styles).
2. Surface rule edge-cases and blind spots earlier (for example, when code is refactored into helpers or middleware).
3. Reduce the risk of overfitting your conference story to a single simplistic sink pattern.

Local seeded demos keep the *conference value* high:

1. You control the vulnerable mechanism precisely (one sink, one route, one vulnerable location).
2. You can run and re-run the demo on demand, with pinned commands and stable outputs.
3. You can pair each “vulnerable” implementation with a “fixed” implementation to show rule-aligned remediation live.

DVNA stays the primary benchmark because it provides a broader baseline of Node/Express vulnerabilities and a shared reference point for DVNA-themed claims.

## Why local seeded demos are better for exact rule alignment
For a static scanner like VibeScan, “exact rule alignment” is easier when the seeded app is engineered around how the engine reasons about code:

1. You can ensure the vulnerable code appears in the same compilation unit as the handler body (important for heuristics that rely on inline handler source, such as `WEBHOOK-001`).
2. You can isolate the vulnerable sink so a finding maps to a specific file, function, and route (reduces adjudication ambiguity).
3. You can design paired vulnerable vs fixed routes so the demo demonstrates *absence* of the finding after the targeted fix (a stronger conference story than “it flags something somewhere”).
4. You can choose mechanisms that map cleanly to implemented VibeScan rules, such as:
   - `injection.sql.string-concat`
   - `injection.path-traversal`
   - `AUTH-004` (admin/mod path without recognizable auth middleware)
   - `WEBHOOK-001` (webhook-like path with body use but missing obvious signature verification)

Net: external repos give realism; local seeded demos give determinism and rule-to-scenario traceability.

## Selection constraints for the conference demo set
- Prefer apps that run locally with minimal dependencies (no large DB setup).
- Avoid non-determinism (random ports, time-based behavior, flaky external calls).
- Avoid “security by obscurity” confounds (for demo purposes, you want the vulnerable behavior to be obvious in code).
- Keep vulnerabilities intentional but non-destructive: demos should not exfiltrate data, execute arbitrary commands, or require real credentials.

