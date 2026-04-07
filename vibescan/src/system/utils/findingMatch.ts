import type { Finding } from "../types.js";
import { computeFindingId } from "../evidence.js";

export function loadFindingsFromSavedJson(text: string): Record<string, unknown>[] {
  const j = JSON.parse(text) as Record<string, unknown>;
  if (Array.isArray(j.findings)) return j.findings as Record<string, unknown>[];
  const results = j.results;
  if (Array.isArray(results)) {
    const out: Record<string, unknown>[] = [];
    for (const r of results) {
      if (r && typeof r === "object" && Array.isArray((r as { findings?: unknown }).findings)) {
        out.push(...((r as { findings: Record<string, unknown>[] }).findings ?? []));
      }
    }
    return out;
  }
  return [];
}

export function syntheticFindingFromRow(o: Record<string, unknown>): Finding {
  return {
    ruleId: String(o.ruleId ?? ""),
    message: String(o.message ?? ""),
    line: Number(o.line ?? 0),
    column: typeof o.column === "number" ? o.column : 0,
    filePath:
      typeof o.filePath === "string"
        ? o.filePath
        : typeof o.file === "string"
          ? o.file
          : undefined,
    severity: "info",
    severityLabel: "LOW",
    category: "injection",
  };
}

export function matchFindingRow(rows: Record<string, unknown>[], targetId: string): Record<string, unknown> | undefined {
  for (const o of rows) {
    if (o.findingId === targetId) return o;
  }
  for (const o of rows) {
    try {
      if (computeFindingId(syntheticFindingFromRow(o)) === targetId) return o;
    } catch {
      continue;
    }
  }
  return undefined;
}
