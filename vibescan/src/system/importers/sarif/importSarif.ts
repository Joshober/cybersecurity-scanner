/**
 * SARIF 2.1.0 → VibeScan-shaped JSON rows (normalized findings).
 */

import { readFileSync } from "node:fs";
import type { ProofFailureCode } from "../../types.js";

export interface ImportedFindingRow {
  ruleId: string;
  message: string;
  severity: string;
  severityLabel: string;
  category: "injection" | "crypto" | "api_inventory";
  line: number;
  column: number;
  filePath?: string;
  file?: string;
  toolOrigin: string;
  toolRuleId?: string;
  sarifLevel?: string;
  /** Original SARIF result id if present. */
  sarifResultIndex?: number;
  proofTierLabel?: "detection_only";
  proofReason?: string;
  proofGeneration?: {
    status: "unsupported";
    wasGenerated: false;
    autoFilled: string[];
    manualNeeded: string[];
    generatorId: string;
    failureReason: string;
    failureCode: ProofFailureCode;
  };
}

export interface ImportSarifResult {
  version: 1;
  tool: { name: string; version?: string; informationUri?: string };
  findings: ImportedFindingRow[];
}

function levelToSeverity(level: string | undefined): { severity: string; label: string } {
  if (level === "error") return { severity: "error", label: "HIGH" };
  if (level === "warning") return { severity: "warning", label: "MEDIUM" };
  if (level === "note") return { severity: "info", label: "LOW" };
  return { severity: "warning", label: "MEDIUM" };
}

function extractUri(
  loc: Record<string, unknown> | undefined
): { file?: string; line: number; column: number } {
  if (!loc || typeof loc !== "object") return { line: 1, column: 0 };
  const phys = loc.physicalLocation as Record<string, unknown> | undefined;
  if (!phys) return { line: 1, column: 0 };
  const art = phys.artifactLocation as { uri?: string } | undefined;
  const region = phys.region as { startLine?: number; startColumn?: number } | undefined;
  return {
    file: art?.uri,
    line: Math.max(1, region?.startLine ?? 1),
    column: region?.startColumn ?? 0,
  };
}

export function importSarifText(text: string, sourceLabel = "sarif-import"): ImportSarifResult {
  const doc = JSON.parse(text) as {
    runs?: Array<{
      tool?: { driver?: { name?: string; version?: string; informationUri?: string } };
      results?: unknown[];
    }>;
  };
  const run = doc.runs?.[0];
  const driver = run?.tool?.driver;
  const toolName = driver?.name ?? "unknown-sarif-tool";
  const results = Array.isArray(run?.results) ? run!.results! : [];
  const findings: ImportedFindingRow[] = [];

  results.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const r = raw as Record<string, unknown>;
    const ruleId = String(r.ruleId ?? "imported-unknown");
    const msg = r.message as { text?: string } | undefined;
    const message = String(msg?.text ?? r.message ?? "");
    const { severity, label } = levelToSeverity(r.level as string | undefined);
    const loc0 = Array.isArray(r.locations) ? (r.locations[0] as Record<string, unknown>) : undefined;
    const phys = loc0?.physicalLocation as Record<string, unknown> | undefined;
    const { file, line, column } = extractUri(phys);

    findings.push({
      ruleId: `${sourceLabel}:${ruleId}`,
      message,
      severity,
      severityLabel: label,
      category: "injection",
      line,
      column,
      filePath: file,
      file,
      toolOrigin: toolName,
      toolRuleId: ruleId,
      sarifLevel: r.level as string | undefined,
      sarifResultIndex: idx,
      proofTierLabel: "detection_only",
      proofReason: "Imported from external SARIF; VibeScan proof generators not applied.",
      proofGeneration: {
        status: "unsupported",
        wasGenerated: false,
        autoFilled: [],
        manualNeeded: ["Re-scan with VibeScan on source or map rule ids to built-in generators."],
        generatorId: "imported-sarif",
        failureReason: "Finding originated from imported SARIF; no local proof emitted.",
        failureCode: "unknown",
      },
    });
  });

  return {
    version: 1,
    tool: {
      name: toolName,
      version: driver?.version,
      informationUri: driver?.informationUri,
    },
    findings,
  };
}

export function importSarifFromFile(absPath: string): ImportSarifResult {
  const text = readFileSync(absPath, "utf-8");
  return importSarifText(text, "sarif-import");
}
