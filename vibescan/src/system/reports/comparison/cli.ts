/**
 * CLI: vibescan comparison-report --vibescan <project.json> [--proof-log <log.json>] [--labels <labels.json>] [--output <report.md>]
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateComparisonMarkdown } from "./report.js";

export function runComparisonReportCli(argv: string[]): number {
  const args = [...argv];
  let vibescanPath: string | undefined;
  let proofLog: string | undefined;
  let labels: string | undefined;
  let output: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--vibescan" && args[i + 1]) {
      vibescanPath = resolve(args[++i]);
      continue;
    }
    if (args[i] === "--proof-log" && args[i + 1]) {
      proofLog = resolve(args[++i]);
      continue;
    }
    if (args[i] === "--labels" && args[i + 1]) {
      labels = resolve(args[++i]);
      continue;
    }
    if (args[i] === "--output" && args[i + 1]) {
      output = resolve(args[++i]);
      continue;
    }
  }
  if (!vibescanPath) {
    console.error(
      "Usage: vibescan comparison-report --vibescan <project.json> [--proof-log proof-run-log.json] [--labels labels.json] [--output report.md]"
    );
    return 1;
  }
  const md = generateComparisonMarkdown({
    vibescanJsonPath: vibescanPath,
    proofRunLogPath: proofLog,
    labelsPath: labels,
  });
  const out = output ?? vibescanPath.replace(/\.json$/i, ".comparison.md");
  writeFileSync(out, md, "utf-8");
  console.error(`Wrote ${out}`);
  return 0;
}
