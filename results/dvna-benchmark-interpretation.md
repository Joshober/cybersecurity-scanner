# Interpreting DVNA benchmark coverage (fair comparison framing)

This note accompanies the **DVNA detection heatmap** (`results/charts/dvna-detection-rate-poster.html`) and the frozen matrices under `results/`. It is meant for reviewers and judges: the strongest framing is **not** “those tools are bad,” but **why different tools occupy different problem spaces** and what a **red cell** does and does not imply.

## Why some tools do not cover every DVNA case

### Scope differences

Some tools in this comparison were not designed to cover the same problem space. For example, **npm audit** is **dependency advisory** scope, not source-code SAST, so **app-code DVNA rows appear uncovered by design**—not as a head-to-head failure against line-level static analysis.

### Lint-oriented baselines

**eslint-plugin-security** is largely **rule- and lint-based**, with limited **inter-file** or **framework-context** reasoning. A sparse heatmap column often reflects that design boundary rather than “no value” in ESLint-driven workflows.

### Rule-pack and configuration differences (Semgrep / CodeQL)

**Semgrep** and **CodeQL** are strong on **detection and traces** for many JavaScript patterns, but outcomes depend on the **rules/query packs enabled** and **framework models**. A missed case does not always mean the engine is incapable; it may mean the relevant rule was not in the **selected configuration**, or that the case needs **custom modeling**.

### Dataflow- and product-shaped tools (Bearer)

**Bearer** emphasizes **risk/dataflow-style reporting** across the codebase, but not **deterministic proof generation** or every **framework-specific** case family. Gaps here are often about product goals and proof/actionability—not raw “can it ever see a sink.”

### Framework-context limitations

Rows such as **NoSQL Injection (route-path / auth-context / session-context)** and other **auth/session**-shaped lessons are **intentionally harder** than naive sink matching: they reward tools that model **web framework semantics**, **middleware**, and **request/session state** across files.

### Detection versus validation

Most compared tools target **detection and explanation**, not **deterministic local proof** artifacts. **VibeScan** adds **proof support** on supported vulnerability families, which is a **different axis of strength**—especially when ◆ appears on the heatmap—without negating others’ detection value.

### Interpretation of gaps

A **gap** on the heatmap should be read as **“not covered in this evaluated configuration and scope”**, not necessarily **“the tool can never detect this class under any circumstances.”**

---

## Chart conventions

- **Rows** are ordered by `caseOrder` in `results/dvna-case-catalog.json`. **Section headers** repeat the **family** (e.g. Injection, Secrets and Crypto). Each data row shows **`rowTitle`** and, when present, **`rowSubtitle`** as the scenario (e.g. three **NoSQL Injection** contexts).
- **Columns** are **tools** from `results/dvna-detection-matrix.json` with chartable SAST scope (e.g. **npm audit** is omitted when the matrix marks it as **gap**—dependency advisories are not first-party line SAST).
- **Green / red** cells mean **hit/miss** vs that row’s anchor lines in the catalog for **this evaluated run/configuration**—not “impossible for the tool forever.”
- **◆** on a **VibeScan** cell: finding aligned to that case with **deterministic local proof** metadata when a VibeScan JSON was passed to the generator.

For regeneration commands and artifact paths, see `docs/vibescan/POSTER-CHARTS.md`.
