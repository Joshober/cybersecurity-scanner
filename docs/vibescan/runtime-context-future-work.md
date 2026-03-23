# Runtime and deployment context (future work)

VibeScan today analyzes **source** (and optionally **package.json** for registry checks). **Future versions** might correlate findings with runtime/deployment artifacts. This section avoids capability claims for the current release.

## Possible correlation targets

| Artifact | Hypothetical use |
|----------|------------------|
| **Deployment manifests** (K8s, Terraform snippets in repo) | Map services to routes or env vars mentioned in code |
| **Build outputs** (webpack/vite bundle graphs) | Down-rank code not shipped to production |
| **Container images** (SBOM, `docker history`) | Confirm dependency versions actually deployed |
| **Active services** (service registry, OpenAPI from gateway) | Compare live surface to static `routeInventory` |
| **Production dependency paths** | `npm ls --production` vs lockfile vs image SBOM |

## Challenges

- Repositories often **lack** the full deploy picture; correlation would be **partial**.
- Sensitive production data must not enter the scanner without governance.

## Research value

If correlation improves **adjudicated** precision of “actionable” findings, that is worth publishing **with** ablation (static-only vs static+correlation).

## Non-goals

- Real-time production monitoring.
- Automatic patch deployment.
