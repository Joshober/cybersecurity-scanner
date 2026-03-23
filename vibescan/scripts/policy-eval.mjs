#!/usr/bin/env node
/**
 * PoC: evaluate a minimal policy against VibeScan project JSON (stdin or file).
 *
 * Usage:
 *   node scripts/policy-eval.mjs policy.sample.json < scan-output.json
 *   node scripts/policy-eval.mjs policy.sample.json path/to/scan-output.json
 */

import { readFileSync } from "node:fs";

const POLICY_RULES = {
  authRequiredOnAdminRoutes: ["AUTH-004"],
  rateLimitRequiredOnSensitiveRoutes: ["MW-002"],
  webhookSignatureVerificationRequired: ["WEBHOOK-001"],
  strongSecretsRequired: [
    "SEC-004",
    "crypto.secrets.hardcoded",
    "crypto.jwt.weak-secret-literal",
    "crypto.random.insecure",
  ],
  corsWildcardDisallowed: ["MW-004"],
};

function loadJson(pathOrDash) {
  const raw =
    pathOrDash === "-"
      ? readFileSync(0, "utf-8")
      : readFileSync(pathOrDash, "utf-8");
  return JSON.parse(raw);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.error("Usage: policy-eval.mjs <policy.json> [scan.json|-]");
    process.exit(2);
  }
  const policyPath = argv[0];
  const scanPath = argv[1] ?? "-";

  const policy = loadJson(policyPath);
  const scan = loadJson(scanPath);
  const findings = scan.findings ?? [];

  const violations = [];
  for (const [key, ruleIds] of Object.entries(POLICY_RULES)) {
    if (!policy[key]) continue;
    const set = new Set(ruleIds);
    for (const f of findings) {
      if (set.has(f.ruleId)) {
        violations.push({ policyKey: key, ruleId: f.ruleId, file: f.file ?? f.filePath, line: f.line });
      }
    }
  }

  const out = { pass: violations.length === 0, violations, policyKeysEvaluated: Object.keys(POLICY_RULES).filter((k) => policy[k]) };
  console.log(JSON.stringify(out, null, 2));
  process.exit(violations.length ? 1 : 0);
}

main();
