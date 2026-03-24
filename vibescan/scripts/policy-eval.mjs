#!/usr/bin/env node
/**
 * Evaluate VibeScan findings against a policy contract (JSON/YAML).
 *
 * Usage:
 *   node scripts/policy-eval.mjs <policy.{json|yaml|yml}> [scan.json|-]
 *   node scripts/policy-eval.mjs --from-settings <settings.global.yaml> [scan.json|-]
 */

import { readFileSync } from "node:fs";
import YAML from "yaml";

const POLICY_RULES = {
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

function usage() {
  return [
    "Usage:",
    "  policy-eval.mjs <policy.{json|yaml|yml}> [scan.json|-]",
    "  policy-eval.mjs --from-settings <settings.global.yaml> [scan.json|-]",
  ].join("\n");
}

function loadStructured(pathOrDash) {
  const raw = pathOrDash === "-" ? readFileSync(0, "utf-8") : readFileSync(pathOrDash, "utf-8");
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  return YAML.parse(raw);
}

function mustBeBooleanPolicy(policy) {
  for (const k of Object.keys(POLICY_RULES)) {
    if (!(k in policy)) continue;
    if (typeof policy[k] !== "boolean") {
      throw new Error(`Invalid policy: "${k}" must be boolean when present.`);
    }
  }
}

function asBool(v, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}

function policyFromSecureArchSettings(settingsDoc) {
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

function parseArgs(argv) {
  if (argv.length === 0) throw new Error(usage());
  if (argv[0] === "--from-settings") {
    if (!argv[1]) throw new Error("Missing settings path for --from-settings.");
    return { mode: "settings", policyPath: argv[1], scanPath: argv[2] ?? "-" };
  }
  return { mode: "policy", policyPath: argv[0], scanPath: argv[1] ?? "-" };
}

function toFindingRows(findings, policy) {
  const out = [];
  for (const [key, ruleIds] of Object.entries(POLICY_RULES)) {
    if (!policy[key]) continue;
    const set = new Set(ruleIds);
    for (const f of findings) {
      if (set.has(f.ruleId)) {
        out.push({
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
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scan = loadStructured(args.scanPath);
  const findings = Array.isArray(scan?.findings) ? scan.findings : [];

  const policy =
    args.mode === "settings"
      ? policyFromSecureArchSettings(loadStructured(args.policyPath))
      : loadStructured(args.policyPath);
  mustBeBooleanPolicy(policy);

  const violations = toFindingRows(findings, policy);
  const byPolicyKey = {};
  for (const v of violations) byPolicyKey[v.policyKey] = (byPolicyKey[v.policyKey] ?? 0) + 1;
  const policyKeysEvaluated = Object.keys(POLICY_RULES).filter((k) => policy[k] === true);

  const out = {
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
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.pass ? 0 : 1);
}

main();
