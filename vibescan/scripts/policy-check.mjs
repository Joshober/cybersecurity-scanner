#!/usr/bin/env node
/**
 * policy-check — CI-oriented gate: fail if VibeScan findings violate policy.
 *
 * Usage:
 *   node policy-check.mjs <policy.json|yaml> <scan.json>
 *   node policy-check.mjs --from-settings <settings.global.yaml> <scan.json>
 *   cat scan.json | node policy-check.mjs policy.json -
 *
 * Policy file:
 *   - Boolean keys mapped in docs/vibescan/secure-arch-policy-bridge.md
 *   - Optional denyRuleIds: string[] — any finding with matching ruleId fails the check
 *
 * Exit 0 if pass, 1 if violations (or invalid args).
 */

import {
  POLICY_RULES,
  loadStructured,
  mustBeBooleanPolicy,
  policyFromSecureArchSettings,
  evaluatePolicy,
} from "./policy-core.mjs";

function usage() {
  return [
    "Usage:",
    "  policy-check.mjs <policy.{json|yaml|yml}> <scan.json|->",
    "  policy-check.mjs --from-settings <settings.global.yaml> <scan.json|->",
  ].join("\n");
}

function parseArgs(argv) {
  if (argv.length === 0) throw new Error(usage());
  if (argv[0] === "--from-settings") {
    if (!argv[1]) throw new Error("Missing settings path for --from-settings.");
    return { mode: "settings", policyPath: argv[1], scanPath: argv[2] ?? "-" };
  }
  if (!argv[1]) throw new Error(usage());
  return { mode: "policy", policyPath: argv[0], scanPath: argv[1] };
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

  const out = evaluatePolicy(findings, policy);

  if (!out.pass) {
    console.error("VibeScan policy-check: FAILED");
    for (const v of out.violations) {
      console.error(
        `  [${v.policyKey}] ${v.ruleId}  ${v.file}:${v.line}  ${v.message.replace(/\s+/g, " ").slice(0, 120)}`
      );
    }
    console.error(`Total violations: ${out.totals.violations}`);
  } else {
    console.error(
      `VibeScan policy-check: PASS (${out.totals.findingsEvaluated} findings evaluated, 0 policy violations)`
    );
  }

  console.log(JSON.stringify(out, null, 2));
  process.exit(out.pass ? 0 : 1);
}

main();
