# Architecture settings schema (v1)

Portable YAML consumed by `@secure-arch/core` and `secure-arch check`.

## Files

- `settings.global.yaml` — `schemaVersion`, `project`, optional `environments.default` (or per-env keys).
- `settings.<env>.yaml` — overrides for one environment; may use `environments.<name>:` or top-level keys only.

## Field reference

| Path | Type | Values / notes |
|------|------|----------------|
| `database.exposure` | string | `internal`, `vpc`, `internet`, `unknown` |
| `database.publiclyReachable` | bool | true if reachable from untrusted networks |
| `authentication.enabled` | bool | |
| `authentication.mechanisms` | string[] | `none`, `session`, `jwt`, `oauth`, `api_key`, `mtls`, `other`, `unknown` |
| `authorization.model` | string | `rbac`, `abac`, `none`, `unknown` |
| `secrets.storage` | string | `vault`, `kms`, `env_vars`, `file`, `repo`, `unknown` |
| `secrets.embeddedInRepo` | bool | true if secrets committed |
| `cors.origins` | string[] | include `*` for wildcard |
| `cors.allowCredentials` | bool | |
| `trustBoundaries.frontendMayReachDatabaseDirectly` | bool | |
| `serviceCommunication.allowlistEnforced` | bool | mTLS / SG / IAM scoped |
| `serviceCommunication.overlyPermissiveIam` | bool | |

## Validation

Runtime validation is implemented in `@secure-arch/core` (`validateSettingsDocument`). Unknown keys are ignored by the normalizer.
