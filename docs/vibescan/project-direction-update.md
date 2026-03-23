# VibeScan project direction update

This note frames how VibeScan is evolving as **defensive security research** and **secure software engineering** tooling. It does not claim parity with dynamic testing or dependency databases.

## Why payload-only scanning is not enough

Many serious failures are not reducible to a single dangerous string at a sink. Authorization mistakes (who may call an operation), missing protections on sensitive surfaces (rate limits, webhook verification), and **where** code runs (production vs dead paths) often dominate real-world impact. Static payload checks remain valuable for injection and weak crypto patterns, but they do not, by themselves, describe **who can reach** a handler or **whether** the deployment context makes a finding actionable.

## Why trust boundaries matter

Applications implicitly separate actors: anonymous users, logged-in users, elevated roles, internal services, third parties, and automation (webhooks). Vulnerabilities frequently appear as **confusion across those boundaries** (e.g., treating webhook input like trusted internal events). Reasoning about boundaries helps prioritize work and design benchmarks that resemble real integration mistakes—not only syntax-level bugs.

## Why endpoint inventory and authorization surface matter

You cannot consistently assess broken access control or abuse resistance without a **working map of HTTP entry points** and the **middleware and conventions** around them. Inventory is incomplete without route definitions, mount prefixes, and (where inferable) authentication or throttling. Static analysis cannot prove runtime authz, but it can flag **inconsistencies and high-risk absences** (e.g., sensitive paths with no recognizable auth middleware in the extracted chain) when the scope and limitations are documented.

## How deployment and build context change prioritization

The same pattern may be **critical** on a route exposed in production and **noise** in a test fixture or unused module. Future work may weight findings using signals such as: inclusion in built artifacts, dependency class (production vs development), and route sensitivity. VibeScan today remains primarily **source-centric**; contextual prioritization is a **design target**, not a guarantee of current behavior.

## How VibeScan fits alongside Snyk, Burp, ZAP, nuclei, and sqlmap

| Orientation | Role |
|-------------|------|
| **Snyk (and similar dependency scanners)** | Known-vulnerable packages and licenses; different evidence base than first-party code heuristics. |
| **Burp / ZAP** | Dynamic exploration, session-aware traffic, and confirmation in a running system. |
| **nuclei** | Template-driven checks against live endpoints; great breadth when URLs are available. |
| **sqlmap** | Targeted exploitation assistance for SQL injection in deployed interfaces. |

**VibeScan** emphasizes **early, local, static** signals in JavaScript/TypeScript (including LLM-generated patterns), optional project-level checks, and **Express-oriented route/middleware heuristics**. It is intended to **complement** the above: comparable baselines and future integrations may help research evaluation, not to assert that static rules replace runtime or dependency analysis.
