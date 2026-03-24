/**
 * Shared policy evaluation: map VibeScan JSON findings to policy booleans and optional deny lists.
 */

import { readFileSync } from "node:fs";
import YAML from "yaml";

export const POLICY_RULES = {
  authRequiredOnAdminRoutes: ["AUTH-004"],
  rateLimitRequiredOnSensitiveRoutes: ["MW-002"],
  webhookSignatureVerificationRequired: ["WEBHOOK-001"],
  strongSecretsRequired: [
    "SEC-004",
    "crypto.secrets.hardcoded",
    "crypto.jwt.weak-secret-literal",
    "crypto.jwt.weak-secret-verify",
    "crypto.random.insecure",
  ],
  corsWildcardDisallowed: ["MW-004"],
  publicDatabaseDisallowed: ["ARCH-DB-001"],
  loggingRequiredOnSensitiveActions: ["LOG-001"],
  llmUnsafeIntegrationDisallowed: [
    "injection.llm.dynamic-system-prompt",
    "injection.llm.rag-template-mixing",
    "injection.llm.unsafe-html-output",
  ],
};

export function loadStructured(pathOrDash) {
  const raw = pathOrDash === "-" ? readFileSync(0, "utf-8") : readFileSync(pathOrDash, "utf-8");
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  return YAML.parse(raw);
}

export function mustBeBooleanPolicy(policy) {
  for (const k of Object.keys(POLICY_RULES)) {
    if (!(k in policy)) continue;
    if (typeof policy[k] !== "boolean") {
      throw new Error(`Invalid policy: "${k}" must be boolean when present.`);
    }
  }
  if ("denyRuleIds" in policy && !Array.isArray(policy.denyRuleIds)) {
    throw new Error('Invalid policy: "denyRuleIds" must be an array of rule ID strings when present.');
  }
}

export function asBool(v, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}

export function policyFromSecureArchSettings(settingsDoc) {
  const envs = settingsDoc?.environments ?? {};
  const envName = Object.keys(envs)[0] ?? "default";
  const env = envs[envName] ?? {};
  return {
    schemaVersion: "1",
    authRequiredOnAdminRoutes: asBool(env?.authentication?.enabled, true),
    rateLimitRequiredOnSensitiveRoutes: asBool(env?.network?.ingressPublic, true),
    webhookSignatureVerificationRequired: asBool(env?.network?.ingressPublic, true),
    strongSecretsRequired: true,
    corsWildcardDisallowed: true,
    publicDatabaseDisallowed: !asBool(env?.database?.publiclyReachable, false),
    loggingRequiredOnSensitiveActions: false,
    llmUnsafeIntegrationDisallowed: false,
    sourceEnvironment: envName,
  };
}

/**
 * @param {unknown[]} findings
 * @param {Record<string, unknown>} policy
 */
export function evaluatePolicy(findings, policy) {
  const violations = [];

  for (const [key, ruleIds] of Object.entries(POLICY_RULES)) {
    if (!policy[key]) continue;
    const set = new Set(ruleIds);
    for (const f of findings) {
      if (set.has(f.ruleId)) {
        violations.push({
          policyKey: key,
          ruleId: f.ruleId,
          severity: f.severity,
          file: f.file ?? f.filePath ?? "",
          line: f.line ?? 1,
          message: f.message ?? "",
        });
      }
    }
  }

  const deny = policy.denyRuleIds;
  if (Array.isArray(deny)) {
    const denySet = new Set(deny.filter((x) => typeof x === "string"));
    for (const f of findings) {
      if (denySet.has(f.ruleId)) {
        violations.push({
          policyKey: "denyRuleIds",
          ruleId: f.ruleId,
          severity: f.severity,
          file: f.file ?? f.filePath ?? "",
          line: f.line ?? 1,
          message: f.message ?? "",
        });
      }
    }
  }

  const policyKeysEvaluated = Object.keys(POLICY_RULES).filter((k) => policy[k] === true);
  if (Array.isArray(deny) && deny.length > 0) policyKeysEvaluated.push("denyRuleIds");

  const byPolicyKey = {};
  for (const v of violations) {
    byPolicyKey[v.policyKey] = (byPolicyKey[v.policyKey] ?? 0) + 1;
  }

  return {
    pass: violations.length === 0,
    totals: {
      findingsEvaluated: findings.length,
      policyKeysEvaluated: policyKeysEvaluated.length,
      violations: violations.length,
    },
    byPolicyKey,
    policyKeysEvaluated,
    violations,
  };
}
