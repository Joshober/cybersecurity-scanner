# Related tools and VibeScan positioning

VibeScan is positioned as **static, first-party-code–centric** analysis for Node/JavaScript/TypeScript with optional project checks—not a substitute for dependency intelligence, dynamic scanners, or exploit frameworks.

| Tool / category | What it is good at | What it is not designed for | Where VibeScan complements it |
|-----------------|-------------------|------------------------------|-------------------------------|
| **SAST / VibeScan** | Fast feedback on source before deploy; AI-typical weak patterns; optional route/middleware heuristics in Express | Proving runtime behavior, session logic, or business authz; full multi-language app models | Adds **local** Express route/middleware hints and LLM-oriented rules alongside generic SAST use |
| **Dependency scanning** (e.g., Snyk SCA, npm audit) | Known CVEs, outdated packages, license/policy | First-party logic errors, missing rate limits on your routes, custom webhook verification | VibeScan focuses on **your code** and **how** dependencies are used; use both for different evidence |
| **DAST / traffic tools** (Burp, ZAP) | Live endpoints, auth flows, session handling, many classes of misconfig seen over HTTP | Deep reasoning over unexposed or uninstrumented code paths without traffic | Static inventory and heuristics **before** runtime testing; DAST **confirms** exposure and behavior |
| **Targeted exploit tools** (nuclei, sqlmap) | High-volume or deep tests against URLs/parameters | Understanding undeployed code or supply chain in the repo | nuclei/sqlmap validate **deployed** attack surface; VibeScan can narrow **what to test** statically |
| **Pipeline / runtime correlation platforms** | Unifying signals across build, deploy, and runtime | Replacing language-specific AST analysis in the IDE | Future VibeScan could **emit** SARIF/JSON for correlation; today it is a **source** signal, not a full platform |

For evaluation discipline, treat overlap as **hypothesis**: comparable slices (e.g., injection-related) may be scored jointly; non-overlapping slices should be reported **separately** rather than forced into a single leaderboard.
