# Amazon Q / universal assistant — architecture settings collector

## Scope
Only edit files under: `architecture/secure-rules/`

## Task
Maintain YAML settings that describe deployment and architecture facts:
- Database exposure (internal / vpc / internet / unknown)
- Authentication and authorization model
- Secrets handling (vault, KMS, env — never paste secret values)
- CORS and public ingress
- Storage public vs private
- Environment isolation (dev/staging/prod)
- Trust boundaries (frontend → DB, public → admin)
- Service-to-service IAM / network allowlists

## Rules
- Do not perform security analysis in this prompt path; run `npx secure-arch check` for validation.
- If uncertain, set fields to `unknown`.
