import type { RawSettingsDoc } from "./schema.js";
import type { AuthMechanism, AuthzModel, EnvironmentFacts, Exposure, SecretStorage } from "./types.js";

function asBool(v: unknown, d: boolean): boolean {
  return typeof v === "boolean" ? v : d;
}

function asStr(v: unknown, d: string): string {
  return typeof v === "string" ? v : d;
}

function asExposure(v: unknown): Exposure {
  const s = asStr(v, "unknown");
  if (s === "internal" || s === "vpc" || s === "internet" || s === "unknown") return s;
  return "unknown";
}

function asAuthMechanisms(v: unknown): AuthMechanism[] {
  if (!Array.isArray(v)) return ["unknown"];
  const out: AuthMechanism[] = [];
  const allowed = new Set<AuthMechanism>([
    "none",
    "session",
    "jwt",
    "oauth",
    "api_key",
    "mtls",
    "other",
    "unknown",
  ]);
  for (const x of v) {
    if (typeof x === "string" && allowed.has(x as AuthMechanism)) out.push(x as AuthMechanism);
  }
  return out.length ? out : ["unknown"];
}

function asAuthzModel(v: unknown): AuthzModel {
  const s = asStr(v, "unknown");
  if (s === "rbac" || s === "abac" || s === "none" || s === "unknown") return s;
  return "unknown";
}

function asSecretStorage(v: unknown): SecretStorage {
  const s = asStr(v, "unknown");
  if (s === "vault" || s === "kms" || s === "env_vars" || s === "file" || s === "repo" || s === "unknown") return s;
  return "unknown";
}

function mergeEnv(globalEnv: Record<string, unknown> | undefined, local: Record<string, unknown>): Record<string, unknown> {
  const g = globalEnv ?? {};
  const out: Record<string, unknown> = { ...g };
  for (const [k, v] of Object.entries(local)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && out[k] !== undefined && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = mergeEnv(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function envSectionToFacts(name: string, section: Record<string, unknown>): EnvironmentFacts {
  const db = (section.database ?? {}) as Record<string, unknown>;
  const auth = (section.authentication ?? {}) as Record<string, unknown>;
  const authz = (section.authorization ?? {}) as Record<string, unknown>;
  const secrets = (section.secrets ?? {}) as Record<string, unknown>;
  const cors = (section.cors ?? {}) as Record<string, unknown>;
  const network = (section.network ?? {}) as Record<string, unknown>;
  const storage = (section.storage ?? {}) as Record<string, unknown>;
  const deployment = (section.deployment ?? {}) as Record<string, unknown>;
  const envIsolation = (section.envIsolation ?? {}) as Record<string, unknown>;
  const trust = (section.trustBoundaries ?? {}) as Record<string, unknown>;
  const svc = (section.serviceCommunication ?? {}) as Record<string, unknown>;

  const originsRaw = cors.origins;
  const origins: string[] = Array.isArray(originsRaw)
    ? originsRaw.filter((x): x is string => typeof x === "string")
    : [];
  const wildcardOrigin = origins.includes("*");

  const anyPublicRead = asBool((storage as { publicBuckets?: unknown }).publicBuckets, false);
  const notes = asStr(storage.notes, "");

  return {
    name,
    database: {
      exposure: asExposure(db.exposure),
      publiclyReachable: asBool(db.publiclyReachable, false),
      allowedClientTypes: Array.isArray(db.allowedClientTypes)
        ? db.allowedClientTypes.filter((x): x is string => typeof x === "string")
        : [],
    },
    authentication: {
      enabled: asBool(auth.enabled, true),
      mechanisms: asAuthMechanisms(auth.mechanisms),
    },
    authorization: {
      model: asAuthzModel(authz.model),
      enforcedEverywhere: asBool(authz.enforcedEverywhere, true),
    },
    secrets: {
      storage: asSecretStorage(secrets.storage),
      embeddedInRepo: asBool(secrets.embeddedInRepo, false),
      embeddedInImages: asBool(secrets.embeddedInImages, false),
    },
    cors: {
      allowCredentials: asBool(cors.allowCredentials, false),
      origins,
      wildcardOrigin,
    },
    network: {
      ingressPublic: asBool(network.ingressPublic, true),
      defaultDenyBetweenServices: asBool(network.defaultDenyBetweenServices, false),
    },
    storage: {
      anyPublicRead,
      notes,
    },
    deployment: {
      target: asStr(deployment.target, "unknown"),
      debugEnabledInProduction: asBool(deployment.debugEnabledInProduction, false),
    },
    envIsolation: {
      separateAccountsOrProjects: asBool(envIsolation.separateAccountsOrProjects, false),
      sharedDatabaseAcrossEnvs: asBool(envIsolation.sharedDatabaseAcrossEnvs, false),
    },
    trustBoundaries: {
      frontendMayReachDatabaseDirectly: asBool(trust.frontendMayReachDatabaseDirectly, false),
      publicApiReachesInternalAdmin: asBool(trust.publicApiReachesInternalAdmin, false),
    },
    serviceCommunication: {
      allowlistEnforced: asBool(svc.allowlistEnforced, false),
      overlyPermissiveIam: asBool(svc.overlyPermissiveIam, false),
    },
  };
}

/**
 * Merge global doc + per-environment docs into EnvironmentFacts map.
 * Expects `globalDoc` from settings.global.yaml and `perEnv` map envName -> partial doc (environments.<name> only or full doc with environments).
 */
export function buildFacts(
  schemaVersion: string,
  projectName: string,
  globalDoc: RawSettingsDoc,
  perEnv: Map<string, RawSettingsDoc>
): import("./types.js").ArchitectureFacts {
  const globalEnvs = (globalDoc.environments ?? {}) as Record<string, Record<string, unknown>>;
  const environments = new Map<string, EnvironmentFacts>();

  for (const [envName, envDoc] of perEnv) {
    const globalForEnv = globalEnvs[envName] ?? globalEnvs["default"];
    const localEnvs = (envDoc.environments ?? {}) as Record<string, Record<string, unknown>>;
    const localSection = localEnvs[envName] ?? (envDoc as unknown as Record<string, unknown>);
    const merged = mergeEnv(globalForEnv, typeof localSection === "object" && localSection !== null ? localSection : {});
    environments.set(envName, envSectionToFacts(envName, merged));
  }

  return {
    schemaVersion,
    projectName,
    environments,
  };
}
