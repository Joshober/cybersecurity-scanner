# Architecture settings and policy docs

This folder contains project-level secure-architecture settings material used by `secure-arch` and `vibescan secure-arch`.

## Contents

| Path | Purpose |
|------|---------|
| `architecture/secure-rules/` | Installed/generated policy settings (YAML) and helper notes. |
| `architecture/secure-rules/schema/settings.schema.v1.md` | Human-readable schema reference for settings files. |
| `architecture/secure-rules/ai-notes.md` | Optional non-sensitive traceability notes for policy maintenance. |

## Canonical command docs

Use [`docs/secure-arch/README.md`](../docs/secure-arch/README.md) for command usage and CI integration.

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
