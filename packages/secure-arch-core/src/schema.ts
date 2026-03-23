import type { AuthMechanism, AuthzModel, Exposure, SecretStorage } from "./types.js";

export interface SchemaError {
  path: string;
  message: string;
}

const ALLOWED_EXPOSURE = new Set<Exposure>(["internal", "vpc", "internet", "unknown"]);
const ALLOWED_AUTH = new Set<AuthMechanism>([
  "none",
  "session",
  "jwt",
  "oauth",
  "api_key",
  "mtls",
  "other",
  "unknown",
]);
const ALLOWED_SECRET = new Set<SecretStorage>(["vault", "kms", "env_vars", "file", "repo", "unknown"]);
const ALLOWED_AUTHZ = new Set<AuthzModel>(["rbac", "abac", "none", "unknown"]);

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function err(path: string, message: string): SchemaError {
  return { path, message };
}

/** Raw document as parsed from YAML (unvalidated). */
export type RawSettingsDoc = Record<string, unknown>;

const TOP_LEVEL_ENV_KEYS = new Set([
  "database",
  "authentication",
  "authorization",
  "secrets",
  "cors",
  "network",
  "storage",
  "deployment",
  "envIsolation",
  "trustBoundaries",
  "serviceCommunication",
]);

export function validateSettingsDocument(doc: unknown, label: string): SchemaError[] {
  const errors: SchemaError[] = [];
  if (!isObject(doc)) {
    errors.push(err(label, "Root must be a mapping"));
    return errors;
  }
  const sv = doc.schemaVersion;
  if (sv !== undefined && typeof sv !== "string") {
    errors.push(err(`${label}.schemaVersion`, "Must be a string"));
  }
  const project = doc.project;
  if (project !== undefined) {
    if (!isObject(project)) errors.push(err(`${label}.project`, "Must be a mapping"));
    else if (project.name !== undefined && typeof project.name !== "string") {
      errors.push(err(`${label}.project.name`, "Must be a string"));
    }
  }
  const envs = doc.environments;
  if (envs !== undefined) {
    if (!isObject(envs)) {
      errors.push(err(`${label}.environments`, "Must be a mapping"));
    } else {
      for (const [envName, envDoc] of Object.entries(envs)) {
        errors.push(...validateEnvironmentSection(envDoc, `${label}.environments.${envName}`));
      }
    }
  } else if (Object.keys(doc).some((k) => TOP_LEVEL_ENV_KEYS.has(k))) {
    errors.push(...validateEnvironmentSection(doc, label));
  }
  return errors;
}

function validateEnvironmentSection(env: unknown, base: string): SchemaError[] {
  const errors: SchemaError[] = [];
  if (!isObject(env)) {
    errors.push(err(base, "Environment must be a mapping"));
    return errors;
  }
  if (env.database !== undefined) {
    if (!isObject(env.database)) errors.push(err(`${base}.database`, "Must be a mapping"));
    else {
      const e = env.database.exposure;
      if (e !== undefined && (typeof e !== "string" || !ALLOWED_EXPOSURE.has(e as Exposure))) {
        errors.push(err(`${base}.database.exposure`, `Must be one of: ${[...ALLOWED_EXPOSURE].join(", ")}`));
      }
      if (env.database.publiclyReachable !== undefined && typeof env.database.publiclyReachable !== "boolean") {
        errors.push(err(`${base}.database.publiclyReachable`, "Must be boolean"));
      }
    }
  }
  if (env.authentication !== undefined) {
    if (!isObject(env.authentication)) errors.push(err(`${base}.authentication`, "Must be a mapping"));
    else {
      if (env.authentication.enabled !== undefined && typeof env.authentication.enabled !== "boolean") {
        errors.push(err(`${base}.authentication.enabled`, "Must be boolean"));
      }
      const mech = env.authentication.mechanisms;
      if (mech !== undefined) {
        if (!Array.isArray(mech)) errors.push(err(`${base}.authentication.mechanisms`, "Must be an array"));
        else {
          for (let i = 0; i < mech.length; i++) {
            const m = mech[i];
            if (typeof m !== "string" || !ALLOWED_AUTH.has(m as AuthMechanism)) {
              errors.push(err(`${base}.authentication.mechanisms[${i}]`, "Invalid mechanism"));
            }
          }
        }
      }
    }
  }
  if (env.authorization !== undefined) {
    if (!isObject(env.authorization)) errors.push(err(`${base}.authorization`, "Must be a mapping"));
    else {
      const m = env.authorization.model;
      if (m !== undefined && (typeof m !== "string" || !ALLOWED_AUTHZ.has(m as AuthzModel))) {
        errors.push(err(`${base}.authorization.model`, "Invalid model"));
      }
      if (env.authorization.enforcedEverywhere !== undefined && typeof env.authorization.enforcedEverywhere !== "boolean") {
        errors.push(err(`${base}.authorization.enforcedEverywhere`, "Must be boolean"));
      }
    }
  }
  if (env.secrets !== undefined) {
    if (!isObject(env.secrets)) errors.push(err(`${base}.secrets`, "Must be a mapping"));
    else {
      const s = env.secrets.storage;
      if (s !== undefined && (typeof s !== "string" || !ALLOWED_SECRET.has(s as SecretStorage))) {
        errors.push(err(`${base}.secrets.storage`, "Invalid storage"));
      }
      if (env.secrets.embeddedInRepo !== undefined && typeof env.secrets.embeddedInRepo !== "boolean") {
        errors.push(err(`${base}.secrets.embeddedInRepo`, "Must be boolean"));
      }
      if (env.secrets.embeddedInImages !== undefined && typeof env.secrets.embeddedInImages !== "boolean") {
        errors.push(err(`${base}.secrets.embeddedInImages`, "Must be boolean"));
      }
    }
  }
  if (env.cors !== undefined) {
    if (!isObject(env.cors)) errors.push(err(`${base}.cors`, "Must be a mapping"));
    else {
      if (env.cors.allowCredentials !== undefined && typeof env.cors.allowCredentials !== "boolean") {
        errors.push(err(`${base}.cors.allowCredentials`, "Must be boolean"));
      }
      if (env.cors.origins !== undefined && !Array.isArray(env.cors.origins)) {
        errors.push(err(`${base}.cors.origins`, "Must be an array of strings"));
      }
    }
  }
  if (env.network !== undefined && !isObject(env.network)) {
    errors.push(err(`${base}.network`, "Must be a mapping"));
  }
  if (env.storage !== undefined && !isObject(env.storage)) {
    errors.push(err(`${base}.storage`, "Must be a mapping"));
  }
  if (env.deployment !== undefined && !isObject(env.deployment)) {
    errors.push(err(`${base}.deployment`, "Must be a mapping"));
  }
  if (env.envIsolation !== undefined && !isObject(env.envIsolation)) {
    errors.push(err(`${base}.envIsolation`, "Must be a mapping"));
  }
  if (env.trustBoundaries !== undefined && !isObject(env.trustBoundaries)) {
    errors.push(err(`${base}.trustBoundaries`, "Must be a mapping"));
  }
  if (env.serviceCommunication !== undefined && !isObject(env.serviceCommunication)) {
    errors.push(err(`${base}.serviceCommunication`, "Must be a mapping"));
  }
  return errors;
}
