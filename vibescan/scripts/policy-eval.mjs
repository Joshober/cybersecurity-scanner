#!/usr/bin/env node
/**
 * Evaluate VibeScan findings against a policy contract (JSON/YAML).
 * Machine-oriented JSON summary on stdout; use policy-check.mjs for CI stderr narrative.
 *
 * Usage:
 *   node policy-eval.mjs <policy.{json|yaml|yml}> [scan.json|-]
 *   node policy-eval.mjs --from-settings <settings.global.yaml> [scan.json|-]
 */

import {
  loadStructured,
  mustBeBooleanPolicy,
  policyFromSecureArchSettings,
  evaluatePolicy,
} from "./policy-core.mjs";

function usage() {
  return [
    "Usage:",
    "  policy-eval.mjs <policy.{json|yaml|yml}> [scan.json|-]",
    "  policy-eval.mjs --from-settings <settings.global.yaml> [scan.json|-]",
  ].join("\n");
}

function parseArgs(argv) {
  if (argv.length === 0) throw new Error(usage());
  if (argv[0] === "--from-settings") {
    if (!argv[1]) throw new Error("Missing settings path for --from-settings.");
    return { mode: "settings", policyPath: argv[1], scanPath: argv[2] ?? "-" };
  }
  return { mode: "policy", policyPath: argv[0], scanPath: argv[1] ?? "-" };
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
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.pass ? 0 : 1);
}

main();
