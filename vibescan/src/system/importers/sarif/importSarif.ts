/**
 * SARIF 2.1.0 → VibeScan-shaped JSON rows (normalized findings).
 */

import { readFileSync } from "node:fs";
import type { ProofFailureCode, Category } from "../../types.js";
import type { SarifRuleMapEntry } from "./ruleMap.js";
import { mapExternalRuleId } from "./ruleMap.js";

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
  /** Canonical VibeScan rule id when rule map matched. */
  mappedRuleId?: string;
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

export interface ImportSarifTextOptions {
  ruleMap?: SarifRuleMapEntry[];
}

function inferCategoryFromProps(props: Record<string, unknown> | undefined): Category {
  const tags = props?.tags;
  if (Array.isArray(tags)) {
    const t = tags.map((x) => String(x).toLowerCase()).join(" ");
    if (t.includes("crypto") || t.includes("secret")) return "crypto";
    if (t.includes("api")) return "api_inventory";
  }
  return "injection";
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

export function importSarifText(
  text: string,
  sourceLabel = "sarif-import",
  options?: ImportSarifTextOptions
): ImportSarifResult {
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

  const mapEntries = options?.ruleMap ?? [];

  results.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const r = raw as Record<string, unknown>;
    const ruleId = String(r.ruleId ?? "imported-unknown");
    const props = r.properties as Record<string, unknown> | undefined;
    const mapped = mapEntries.length ? mapExternalRuleId(toolName, ruleId, mapEntries) : undefined;
    const msg = r.message as { text?: string } | undefined;
    const message = String(msg?.text ?? r.message ?? "");
    const { severity, label } = levelToSeverity(r.level as string | undefined);
    const loc0 = Array.isArray(r.locations) ? (r.locations[0] as Record<string, unknown>) : undefined;
    const { file, line, column } = extractUri(loc0);
    const category = inferCategoryFromProps(props);
    const displayRuleId = mapped ?? `${sourceLabel}:${ruleId}`;

    findings.push({
      ruleId: displayRuleId,
      message,
      severity,
      severityLabel: label,
      category,
      line,
      column,
      filePath: file,
      file,
      toolOrigin: toolName,
      toolRuleId: ruleId,
      sarifLevel: r.level as string | undefined,
      sarifResultIndex: idx,
      ...(mapped ? { mappedRuleId: mapped } : {}),
      proofTierLabel: "detection_only",
      proofReason: mapped
        ? "Imported SARIF; rule id mapped to VibeScan. Re-scan or emit-proofs for local proof when context allows."
        : "Imported from external SARIF; VibeScan proof generators not applied.",
      proofGeneration: {
        status: "unsupported",
        wasGenerated: false,
        autoFilled: mapped ? [`mapped to ${mapped}`] : [],
        manualNeeded: mapped ? [] : ["Re-scan with VibeScan on source or map rule ids to built-in generators."],
        generatorId: "imported-sarif",
        failureReason: mapped
          ? "Imported SARIF row; merge-scan or emit-proofs can attach proofs when matched to native findings."
          : "Finding originated from imported SARIF; no local proof emitted.",
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

export function importSarifFromFile(absPath: string, options?: ImportSarifTextOptions): ImportSarifResult {
  const text = readFileSync(absPath, "utf-8");
  return importSarifText(text, "sarif-import", options);
}
