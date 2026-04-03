/**
 * Cross-tool comparison summary (markdown) for benchmarks / posters.
 */

import { readFileSync, existsSync } from "node:fs";
import type { ProofRunLog } from "../../proof/runner.js";

export interface ComparisonLabels {
  /** findingId -> "tp" | "fp" | "unknown" */
  [findingId: string]: string;
}

export interface ComparisonReportInput {
  /** formatProjectJson output path */
  vibescanJsonPath: string;
  /** Optional proof-run-log.json from prove --run */
  proofRunLogPath?: string;
  /** Optional JSON: { "vs1-abc...": "tp" } */
  labelsPath?: string;
}

export function loadLabels(path: string): ComparisonLabels {
  if (!existsSync(path)) return {};
  const j = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  return j as ComparisonLabels;
}

export function generateComparisonMarkdown(input: ComparisonReportInput): string {
  const proj = JSON.parse(readFileSync(input.vibescanJsonPath, "utf-8")) as {
    summary?: { proofCoverage?: Record<string, unknown>; totalFindings?: number };
    findings?: Array<{ findingId?: string; proofTierLabel?: string }>;
  };
  const findings = proj.findings ?? [];
  const pc = proj.summary?.proofCoverage ?? {};
  const labels = input.labelsPath ? loadLabels(input.labelsPath) : {};

  let proofLog: ProofRunLog | undefined;
  if (input.proofRunLogPath && existsSync(input.proofRunLogPath)) {
    proofLog = JSON.parse(readFileSync(input.proofRunLogPath, "utf-8")) as ProofRunLog;
  }

  let tp = 0;
  let fp = 0;
  for (const f of findings) {
    const id = f.findingId as string | undefined;
    if (!id) continue;
    const lab = labels[id];
    if (lab === "tp") tp++;
    else if (lab === "fp") fp++;
  }

  const lines: string[] = [
    "# VibeScan comparison report",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Total findings | ${findings.length} |`,
    `| Proof coverage % (summary) | ${String(pc["proof_coverage_percent"] ?? "—")} |`,
    `| Deterministic proof % (generated) | ${String(pc["deterministic_proof_percent"] ?? "—")} |`,
  ];

  if (Object.keys(labels).length > 0) {
    lines.push(`| Labeled true positives | ${tp} |`);
    lines.push(`| Labeled false positives | ${fp} |`);
  }

  if (proofLog) {
    lines.push(`| Proof runs executed | ${proofLog.summary.executed} |`);
    lines.push(`| Proof pass | ${proofLog.summary.pass} |`);
    lines.push(`| Proof fail | ${proofLog.summary.fail} |`);
    lines.push(`| Proof inconclusive | ${proofLog.summary.inconclusive} |`);
    if ("flaky" in proofLog.summary) {
      lines.push(`| Proof flaky (retries) | ${proofLog.summary.flaky} |`);
    }
    const avg =
      proofLog.summary.executed > 0
        ? Math.round(proofLog.summary.totalDurationMs / proofLog.summary.executed)
        : 0;
    lines.push(`| Avg proof runtime (ms) | ${avg} |`);
  }

  lines.push("", "_Ground-truth labels are optional; supply a JSON map of findingId → tp/fp for precision/recall._");
  return lines.join("\n");
}
