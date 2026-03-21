import type { Finding, ScanResult, ProjectScanResult } from "./types.js";

const ansi = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  orange: "\x1b[33m", // yellow/orange on most terminals
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
};

function colorForSeverity(label: string, useColor: boolean): (s: string) => string {
  if (!useColor) return (s) => s;
  const u = label.toUpperCase();
  if (u === "CRITICAL") return (s) => `${ansi.red}${s}${ansi.reset}`;
  if (u === "HIGH") return (s) => `${ansi.orange}${s}${ansi.reset}`;
  if (u === "MEDIUM") return (s) => `${ansi.yellow}${s}${ansi.reset}`;
  if (u === "LOW" || u === "INFO") return (s) => `${ansi.blue}${s}${ansi.reset}`;
  return (s) => s;
}

function metaLine(f: Finding, useColor: boolean): string {
  const parts: string[] = [];
  if (f.findingKind) parts.push(f.findingKind);
  if (f.cwe != null) parts.push(`CWE-${f.cwe}`);
  if (f.owasp) parts.push(`OWASP ${f.owasp}`);
  if (!parts.length) return "";
  const body = parts.join(" · ");
  return useColor ? `  ${ansi.dim}${body}${ansi.reset}` : `  ${body}`;
}

/** Group flat findings by filePath for display. */
export function projectFindingsToScanResults(project: ProjectScanResult): ScanResult[] {
  const m = new Map<string, Finding[]>();
  for (const f of project.findings) {
    const key = f.filePath ?? "(unknown)";
    let arr = m.get(key);
    if (!arr) {
      arr = [];
      m.set(key, arr);
    }
    arr.push(f);
  }
  return [...m.entries()].map(([filePath, findings]) => ({ filePath, findings }));
}

export function formatHuman(results: ScanResult[], useColor = false): string {
  const lines: string[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      const c = colorForSeverity(f.severityLabel ?? "HIGH", useColor);
      const loc = f.filePath ?? r.filePath;
      lines.push(c(`[${f.severityLabel}] ${f.message}`));
      const meta = metaLine(f, useColor);
      if (meta) lines.push(meta);
      lines.push(`File: ${loc}:${f.line}`);
      if (f.sourceLabel) lines.push(`Source: ${f.sourceLabel}`);
      if (f.sinkLabel) lines.push(`Sink: ${f.sinkLabel}`);
      lines.push(`Rule: ${f.ruleId}`);
      if (f.why) lines.push(`Why: ${f.why}`);
      const remed = f.remediation ?? f.fix;
      if (remed) lines.push(`Fix: ${remed}`);
      if (f.cveRef?.length) lines.push(`CVE: ${f.cveRef.join(", ")}`);
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd();
}

export function formatCompact(results: ScanResult[], useColor = false): string {
  const lines: string[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      const c = colorForSeverity(f.severityLabel ?? "HIGH", useColor);
      const severityPad = (f.severityLabel ?? "HIGH").padEnd(8);
      const loc = f.filePath ?? r.filePath;
      lines.push(
        `${c(severityPad)}${f.message.padEnd(24)}  ${loc}:${f.line}`
      );
    }
  }
  return lines.join("\n");
}

function findingToJson(f: Finding): Record<string, unknown> {
  return {
    ruleId: f.ruleId,
    message: f.message,
    why: f.why,
    fix: f.fix,
    remediation: f.remediation,
    severity: f.severity,
    severityLabel: f.severityLabel,
    category: f.category,
    cwe: f.cwe,
    owasp: f.owasp,
    cveRef: f.cveRef,
    findingKind: f.findingKind,
    generatedTest: f.generatedTest,
    line: f.line,
    column: f.column,
    endLine: f.endLine,
    endColumn: f.endColumn,
    sourceLabel: f.sourceLabel,
    sinkLabel: f.sinkLabel,
    filePath: f.filePath,
  };
}

export function formatJson(results: ScanResult[]): string {
  return JSON.stringify(
    results.map((r) => ({
      filePath: r.filePath,
      findings: r.findings.map((f) => findingToJson(f)),
    })),
    null,
    2
  );
}

export function formatProjectJson(project: ProjectScanResult): string {
  return JSON.stringify(
    {
      routes: project.routes,
      packageJsonPath: project.packageJsonPath,
      findings: project.findings.map((f) => findingToJson(f)),
      fileResults: project.fileResults.map((r) => ({
        filePath: r.filePath,
        findings: r.findings.map((f) => findingToJson(f)),
        routeCount: r.routes?.length ?? 0,
      })),
    },
    null,
    2
  );
}
