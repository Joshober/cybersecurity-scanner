import type { ScanResult } from "./types.js";

export function formatHuman(results: ScanResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      lines.push(`[${f.severityLabel}] ${f.message}`);
      lines.push(`File: ${r.filePath}:${f.line}`);
      if (f.sourceLabel) lines.push(`Source: ${f.sourceLabel}`);
      if (f.sinkLabel) lines.push(`Sink: ${f.sinkLabel}`);
      lines.push(`Rule: ${f.ruleId}`);
      if (f.why) lines.push(`Why: ${f.why}`);
      if (f.fix) lines.push(`Fix: ${f.fix}`);
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd();
}

export function formatCompact(results: ScanResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      const severityPad = (f.severityLabel ?? "HIGH").padEnd(8);
      lines.push(`${severityPad}${f.message.padEnd(24)}  ${r.filePath}:${f.line}`);
    }
  }
  return lines.join("\n");
}

export function formatJson(results: ScanResult[]): string {
  return JSON.stringify(
    results.map((r) => ({
      filePath: r.filePath,
      findings: r.findings.map((f) => ({
        ruleId: f.ruleId,
        message: f.message,
        why: f.why,
        fix: f.fix,
        severity: f.severity,
        severityLabel: f.severityLabel,
        category: f.category,
        line: f.line,
        column: f.column,
        endLine: f.endLine,
        endColumn: f.endColumn,
        sourceLabel: f.sourceLabel,
        sinkLabel: f.sinkLabel,
      })),
    })),
    null,
    2
  );
}
