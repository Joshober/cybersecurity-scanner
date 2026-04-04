# Architecture settings and policy docs

This folder lives under **`vibescan/`** and holds secure-architecture YAML + notes consumed by **`secure-arch`** and **`vibescan secure-arch`** (paths are relative to the **repository root** by default: `vibescan/architecture/secure-rules`).

## Contents

| Path | Purpose |
|------|---------|
| `vibescan/architecture/secure-rules/` (from repo root) | Installed/generated policy settings (YAML) and helper notes. |
| `secure-rules/schema/settings.schema.v1.md` | Human-readable schema reference for settings files. |
| `secure-rules/ai-notes.md` | Optional non-sensitive traceability notes for policy maintenance. |

## Canonical command docs

Use [`vibescan/README.md`](../README.md) (**secure-arch** section) for command usage and CI integration.

Typical lifecycle:

```bash
npx secure-arch install --root .
npx secure-arch init --tool cursor --root .
npx secure-arch check --root . --code-evidence js-ts --format human
```

Equivalent via the published scanner package:

```bash
npx vibescan secure-arch install --root .
npx vibescan secure-arch check --root . --code-evidence js-ts
```
