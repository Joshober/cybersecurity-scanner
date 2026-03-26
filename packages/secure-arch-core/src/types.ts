/** Severity for architecture findings (aligns with VibeScan). */
export type ArchSeverity = "critical" | "error" | "warning" | "info";

export interface ArchitectureFinding {
  ruleId: string;
  severity: ArchSeverity;
  message: string;
  why?: string;
  remediation?: string;
  /** Dot-path into merged settings (e.g. environments.production.database.exposure). */
  settingsPath?: string;
  environment?: string;
  /** Code evidence (file:line). */
  evidence?: string[];
  cwe?: number;
  owasp?: string;
}

export type Exposure = "internal" | "vpc" | "internet" | "unknown";
export type AuthMechanism =
  | "none"
  | "session"
  | "jwt"
  | "oauth"
  | "api_key"
  | "mtls"
  | "other"
  | "unknown";
export type SecretStorage = "vault" | "kms" | "env_vars" | "file" | "repo" | "unknown";
export type AuthzModel = "rbac" | "abac" | "none" | "unknown";

/** Normalized facts for one environment after merge(global + env). */
export interface EnvironmentFacts {
  name: string;
  database: {
    exposure: Exposure;
    publiclyReachable: boolean;
    allowedClientTypes: string[];
  };
  authentication: {
    enabled: boolean;
    mechanisms: AuthMechanism[];
  };
  authorization: {
    model: AuthzModel;
    enforcedEverywhere: boolean;
  };
  secrets: {
    storage: SecretStorage;
    embeddedInRepo: boolean;
    embeddedInImages: boolean;
  };
  cors: {
    allowCredentials: boolean;
    origins: string[];
    wildcardOrigin: boolean;
  };
  network: {
    ingressPublic: boolean;
    defaultDenyBetweenServices: boolean;
  };
  storage: {
    anyPublicRead: boolean;
    notes: string;
  };
  deployment: {
    target: string;
    debugEnabledInProduction: boolean;
  };
  envIsolation: {
    separateAccountsOrProjects: boolean;
    sharedDatabaseAcrossEnvs: boolean;
  };
  trustBoundaries: {
    frontendMayReachDatabaseDirectly: boolean;
    publicApiReachesInternalAdmin: boolean;
  };
  serviceCommunication: {
    allowlistEnforced: boolean;
    overlyPermissiveIam: boolean;
  };
}

export interface ArchitectureFacts {
  schemaVersion: string;
  projectName: string;
  environments: Map<string, EnvironmentFacts>;
}

export interface CheckContext {
  facts: ArchitectureFacts;
  settingsDir: string;
}

export type CodeEvidenceMode = "off" | "js-ts" | "all";

export interface EvidenceOptions {
  mode: CodeEvidenceMode;
  projectRoot: string;
  scanPaths: string[];
}
