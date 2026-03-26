import type { ArchitectureFinding, ArchSeverity, CheckContext, EnvironmentFacts } from "../types.js";

function baseFinding(
  ruleId: string,
  severity: ArchitectureFinding["severity"],
  message: string,
  opts: Partial<ArchitectureFinding> = {}
): ArchitectureFinding {
  return { ruleId, severity, message, ...opts };
}

export function runSettingsChecks(ctx: CheckContext): ArchitectureFinding[] {
  const out: ArchitectureFinding[] = [];
  for (const [envName, e] of ctx.facts.environments) {
    out.push(...checksForEnv(envName, e));
  }
  return out;
}

function checksForEnv(env: string, e: EnvironmentFacts): ArchitectureFinding[] {
  const p = (suffix: string) => `environments.${env}.${suffix}`;
  const findings: ArchitectureFinding[] = [];

  if (e.database.exposure === "internet" || e.database.publiclyReachable) {
    findings.push(
      baseFinding(
        "ARCH-001",
        "critical",
        `Database is internet-exposed or marked publicly reachable (${env}).`,
        {
          why: "Internet-facing databases are a high-value target; use private networking and least-privilege access.",
          remediation: "Move database behind VPC/private link; restrict security groups; require TLS and strong auth.",
          settingsPath: p("database"),
          environment: env,
          cwe: 284,
          owasp: "A05:2021",
        }
      )
    );
  }

  if (e.secrets.embeddedInRepo || e.secrets.storage === "repo") {
    findings.push(
      baseFinding(
        "ARCH-002",
        "critical",
        `Secrets are stored in the repository or embedded in source (${env}).`,
        {
          why: "Secrets in git history are effectively public; rotation cannot undo leaks.",
          remediation: "Use a secret manager (Vault/KMS/CI secrets) and reference via environment or workload identity.",
          settingsPath: p("secrets"),
          environment: env,
          cwe: 798,
          owasp: "A07:2021",
        }
      )
    );
  }

  if (!e.authentication.enabled || e.authentication.mechanisms.includes("none")) {
    findings.push(
      baseFinding(
        "ARCH-003",
        "error",
        `Authentication is disabled or explicitly 'none' (${env}).`,
        {
          why: "Missing authentication breaks the primary trust boundary for callers.",
          remediation: "Enable authentication for all non-public endpoints; document public exceptions explicitly.",
          settingsPath: p("authentication"),
          environment: env,
          cwe: 306,
          owasp: "A07:2021",
        }
      )
    );
  }

  if (e.authorization.model === "none" || !e.authorization.enforcedEverywhere) {
    findings.push(
      baseFinding(
        "ARCH-004",
        "error",
        `Authorization is weak or not enforced everywhere (${env}).`,
        {
          why: "Authentication without authorization leads to IDOR/BOLA-style access.",
          remediation: "Enforce RBAC/ABAC at every sensitive operation; deny by default.",
          settingsPath: p("authorization"),
          environment: env,
          cwe: 285,
          owasp: "A01:2021",
        }
      )
    );
  }

  if (e.cors.wildcardOrigin && e.cors.allowCredentials) {
    findings.push(
      baseFinding(
        "ARCH-005",
        "critical",
        `CORS allows wildcard origin with credentials (${env}) — browsers will block or misconfigure dangerously.`,
        {
          why: "Wildcard origins with credentials are invalid in browsers and often force unsafe workarounds.",
          remediation: "Use an explicit allowlist of origins; avoid '*' when cookies/Authorization cross-origin.",
          settingsPath: p("cors"),
          environment: env,
          cwe: 942,
          owasp: "A05:2021",
        }
      )
    );
  }

  if (e.cors.wildcardOrigin && e.network.ingressPublic) {
    findings.push(
      baseFinding(
        "ARCH-006",
        "warning",
        `CORS wildcard origin on a publicly ingress-exposed service (${env}).`,
        {
          why: "Any site may read non-credentialed responses; combine with sensitive data = excessive exposure.",
          remediation: "Restrict CORS origins to known frontends and APIs.",
          settingsPath: p("cors"),
          environment: env,
          cwe: 942,
          owasp: "A05:2021",
        }
      )
    );
  }

  if (e.storage.anyPublicRead) {
    findings.push(
      baseFinding(
        "ARCH-007",
        "error",
        `Object/storage layer allows public read (${env}).`,
        {
          why: "Public buckets often leak backups, PII, or signing keys.",
          remediation: "Use private buckets with signed URLs or OPA/IAM-scoped access.",
          settingsPath: p("storage"),
          environment: env,
          cwe: 284,
          owasp: "A01:2021",
        }
      )
    );
  }

  if (e.trustBoundaries.frontendMayReachDatabaseDirectly) {
    findings.push(
      baseFinding(
        "ARCH-008",
        "critical",
        `Frontend may reach the database directly (${env}).`,
        {
          why: "Bypasses API trust boundary; credentials and schema exposed to clients.",
          remediation: "Route all data access through backend services; never ship DB credentials to clients.",
          settingsPath: p("trustBoundaries"),
          environment: env,
          cwe: 923,
          owasp: "A04:2021",
        }
      )
    );
  }

  if (e.trustBoundaries.publicApiReachesInternalAdmin) {
    findings.push(
      baseFinding(
        "ARCH-009",
        "error",
        `Public API can reach internal/admin surfaces (${env}).`,
        {
          why: "Violates network segmentation; lateral movement risk.",
          remediation: "Split admin APIs; use separate auth, network policies, and ingress.",
          settingsPath: p("trustBoundaries"),
          environment: env,
          cwe: 923,
          owasp: "A01:2021",
        }
      )
    );
  }

  if (e.envIsolation.sharedDatabaseAcrossEnvs) {
    findings.push(
      baseFinding(
        "ARCH-010",
        "warning",
        `Development/staging/production share database state (${env}).`,
        {
          why: "Environment isolation fails; test data and prod data mix risk.",
          remediation: "Separate databases per environment; use anonymized fixtures in lower envs.",
          settingsPath: p("envIsolation"),
          environment: env,
          owasp: "A05:2021",
        }
      )
    );
  }

  if (!e.envIsolation.separateAccountsOrProjects && env === "production") {
    findings.push(
      baseFinding(
        "ARCH-011",
        "info",
        `Production does not declare separate cloud accounts/projects from non-prod.`,
        {
          why: "Blast radius and IAM mistakes span environments.",
          remediation: "Use separate accounts/projects with controlled promotion pipelines.",
          settingsPath: p("envIsolation"),
          environment: env,
        }
      )
    );
  }

  if (!e.serviceCommunication.allowlistEnforced || e.serviceCommunication.overlyPermissiveIam) {
    const sev: ArchSeverity = env === "production" ? "error" : "warning";
    findings.push(
      baseFinding(
        "ARCH-012",
        sev,
        `Service-to-service communication lacks allowlists or uses overly permissive IAM (${env}).`,
        {
          why: "Violates least privilege between services.",
          remediation: "Enforce mTLS/SPIFFE, security groups, or IAM resource-scoped policies per workload.",
          settingsPath: p("serviceCommunication"),
          environment: env,
          cwe: 250,
          owasp: "A01:2021",
        }
      )
    );
  }

  if (e.deployment.debugEnabledInProduction && env === "production") {
    findings.push(
      baseFinding(
        "ARCH-013",
        "error",
        `Debug or verbose modes enabled in production deployment.`,
        {
          why: "Leaks stack traces, internals, and aids attackers.",
          remediation: "Disable debug flags; use structured logging with redaction.",
          settingsPath: p("deployment"),
          environment: env,
          cwe: 497,
          owasp: "A09:2021",
        }
      )
    );
  }

  if (e.network.ingressPublic && !e.network.defaultDenyBetweenServices) {
    const sev: ArchSeverity = env === "production" ? "warning" : "info";
    findings.push(
      baseFinding(
        "ARCH-014",
        sev,
        `Public ingress without default-deny between services (${env}).`,
        {
          why: "Flat network increases lateral movement after one compromise.",
          remediation: "Adopt default-deny network policies between services; allow explicit paths only.",
          settingsPath: p("network"),
          environment: env,
          owasp: "A05:2021",
        }
      )
    );
  }

  return findings;
}
