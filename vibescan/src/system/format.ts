import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Finding, ScanResult, ProjectScanResult, Severity, Category } from "./types.js";
import { getConfidenceScore, getRuleDocumentation, type RuleDocumentation } from "./ruleCatalog.js";

/** Aggregated counts for benchmarks / CI. */
export interface FindingsSummary {
  totalFindings: number;
  bySeverity: Record<Severity, number>;
  byRuleId: Record<string, number>;
  byCategory: Record<Category, number>;
}

/** Options for project JSON (benchmark / reproducibility). */
export interface FormatProjectJsonOptions {
  /** Add `run` block with version, timestamp, git commit, echoed scan options. */
  benchmarkMetadata?: boolean;
  /** Add `ruleFamily` on each finding (stable taxonomy for papers). */
  includeRuleFamily?: boolean;
  toolVersion?: string;
  gitCommit?: string | null;
  scanOptions?: Record<string, unknown>;
}

const LEGACY_RULE_FAMILY: Record<string, string> = {
  "SEC-004": "crypto.secrets",
  "SSRF-003": "injection.ssrf",
  "RULE-SSRF-002": "injection.ssrf",
  "SLOP-001": "supply_chain.registry",
  "AUTH-003": "auth.middleware",
  "AUTH-004": "auth.middleware",
  "AUTH-005": "auth.middleware",
  "MW-001": "middleware.order",
  "MW-002": "middleware.rate_limit",
  "MW-003": "middleware.headers",
  "MW-004": "middleware.cors",
  "API-INV-001": "api.inventory",
  "API-INV-002": "api.inventory",
  "API-POSTURE-001": "api.inventory",
  "WEBHOOK-001": "webhook.verification",
};

/** Stable family label for mixed legacy and dotted rule IDs. */
export function ruleFamilyForRuleId(ruleId: string): string | undefined {
  if (LEGACY_RULE_FAMILY[ruleId]) return LEGACY_RULE_FAMILY[ruleId];
  if (ruleId.includes(".")) {
    const parts = ruleId.split(".");
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  }
  return undefined;
}

function compareFindingsStable(a: Finding, b: Finding): number {
  const fa = a.filePath ?? "";
  const fb = b.filePath ?? "";
  if (fa !== fb) return fa < fb ? -1 : 1;
  const la = a.line ?? 0;
  const lb = b.line ?? 0;
  if (la !== lb) return la - lb;
  const ca = a.column ?? 0;
  const cb = b.column ?? 0;
  if (ca !== cb) return ca - cb;
  return a.ruleId.localeCompare(b.ruleId);
}

export function sortFindingsStable(findings: Finding[]): Finding[] {
  return [...findings].sort(compareFindingsStable);
}

function findingsPerFileCounts(findings: Finding[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const f of findings) {
    const p = f.filePath ?? "(unknown)";
    m[p] = (m[p] ?? 0) + 1;
  }
  return m;
}

/** Read `version` from repository root package.json (compiled: dist/system/format.js → ../..). */
export function readScannerPackageVersion(): string {
  try {
    const pkgPath = join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function summarizeFindings(findings: Finding[]): FindingsSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
  };
  const byRuleId: Record<string, number> = {};
  const byCategory: Record<Category, number> = { crypto: 0, injection: 0, api_inventory: 0 };

  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
    byRuleId[f.ruleId] = (byRuleId[f.ruleId] ?? 0) + 1;
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
  }

  return {
    totalFindings: findings.length,
    bySeverity,
    byRuleId,
    byCategory,
  };
}

/** Canonical path for JSON/SARIF (finding target file). */
export function findingDisplayFile(f: Finding, fallbackFile?: string): string {
  return f.filePath ?? fallbackFile ?? "";
}

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

/** One finding block: severity, impact, location, confidence, fix, example, references. */
export function formatFindingDetailed(f: Finding, fileFallback: string, index: number, total: number, useColor: boolean): string {
  const c = colorForSeverity(f.severityLabel ?? "HIGH", useColor);
  const dim = useColor ? (s: string) => `${ansi.dim}${s}${ansi.reset}` : (s: string) => s;
  const loc = f.filePath ?? fileFallback;
  const doc = getRuleDocumentation(f.ruleId);
  const conf = getConfidenceScore(f);
  const why = f.why?.trim() || doc.risk;
  const fix = (f.remediation ?? f.fix)?.trim() || doc.remediation;
  const lines: string[] = [];
  lines.push(dim(`── Finding ${index}/${total} ──`));
  lines.push(c(`${f.severityLabel}  ${f.ruleId}: ${f.message}`));
  const meta = metaLine(f, useColor);
  if (meta) lines.push(meta);
  lines.push(dim("Location"));
  lines.push(`  File: ${loc}`);
  lines.push(`  Line: ${f.line}` + (f.column != null ? `, column: ${f.column}` : ""));
  if (f.route) {
    lines.push(`  Route: ${f.route.method} ${f.route.fullPath}`);
  }
  if (f.sourceLabel) lines.push(dim("  Data flow · Source: ") + f.sourceLabel);
  if (f.sinkLabel) lines.push(dim("  Data flow · Sink: ") + f.sinkLabel);
  lines.push(dim("Why it matters"));
  lines.push(`  ${why}`);
  lines.push(dim(`Confidence: ${conf} (heuristic static analysis; confirm in code review)`));
  lines.push(dim("Suggested fix"));
  lines.push(`  ${fix}`);
  lines.push(dim("Safe pattern (example)"));
  const exampleLines = doc.secureExample.trim().split("\n");
  for (const el of exampleLines) lines.push(`  ${el}`);
  lines.push(dim("References"));
  for (const url of doc.referenceUrls) lines.push(`  ${url}`);
  if (f.packageName) lines.push(dim("Package: ") + f.packageName);
  if (f.cveRef?.length) lines.push(dim("CVE: ") + f.cveRef.join(", "));
  if (f.proofGeneration) {
    const p = f.proofGeneration;
    lines.push(dim("Proof-oriented test generation"));
    lines.push(
      `  status: ${p.status} · generator: ${p.generatorId} · generated: ${p.wasGenerated ? "yes" : "no"}`
    );
    if (p.generatedPath) lines.push(`  path: ${p.generatedPath}`);
    if (p.autoFilled?.length) lines.push(`  auto-filled: ${p.autoFilled.join("; ")}`);
    if (p.manualNeeded?.length) lines.push(`  manual: ${p.manualNeeded.join("; ")}`);
    if (p.notes) lines.push(`  notes: ${p.notes}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function formatHuman(results: ScanResult[], useColor = false): string {
  const flat: { f: Finding; fileFallback: string }[] = [];
  for (const r of results) {
    for (const f of r.findings) flat.push({ f, fileFallback: r.filePath });
  }
  const lines: string[] = [];
  const total = flat.length;
  let i = 0;
  for (const { f, fileFallback } of flat) {
    i += 1;
    lines.push(formatFindingDetailed(f, fileFallback, i, total, useColor));
  }
  return lines.join("\n").trimEnd();
}

/** Narrative for governance exports and AI rule packs. */
export function ruleDocumentationForExport(ruleId: string): RuleDocumentation {
  return getRuleDocumentation(ruleId);
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

export function findingToJson(
  f: Finding,
  fallbackFile?: string,
  includeRuleFamily = false,
  includeRuleDocs = false
): Record<string, unknown> {
  const file = findingDisplayFile(f, fallbackFile);
  const doc = getRuleDocumentation(f.ruleId);
  const row: Record<string, unknown> = {
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
    packageName: f.packageName,
    generatedTest: f.generatedTest,
    line: f.line,
    column: f.column,
    endLine: f.endLine,
    endColumn: f.endColumn,
    sourceLabel: f.sourceLabel,
    sinkLabel: f.sinkLabel,
    file,
    filePath: f.filePath,
    confidence: getConfidenceScore(f),
    ...(f.route ? { route: f.route } : {}),
    ...(f.proofHints ? { proofHints: f.proofHints } : {}),
    ...(f.proofGeneration ? { proofGeneration: f.proofGeneration } : {}),
  };
  if (includeRuleFamily) {
    const rf = ruleFamilyForRuleId(f.ruleId);
    if (rf) row.ruleFamily = rf;
  }
  if (includeRuleDocs) {
    row.ruleDocumentation = {
      title: doc.title,
      pattern: doc.pattern,
      risk: doc.risk,
      falsePositives: doc.falsePositives,
      remediation: doc.remediation,
      secureExample: doc.secureExample,
      referenceUrls: doc.referenceUrls,
    };
  }
  return row;
}

export function formatJson(results: ScanResult[]): string {
  const allFindings = results.flatMap((r) => r.findings);
  return JSON.stringify(
    {
      summary: summarizeFindings(allFindings),
      results: results.map((r) => ({
        filePath: r.filePath,
        file: r.filePath,
        findings: r.findings.map((f) => findingToJson(f, r.filePath)),
      })),
    },
    null,
    2
  );
}

export function formatProjectJson(
  project: ProjectScanResult,
  options?: FormatProjectJsonOptions
): string {
  const sortedFlat = sortFindingsStable(project.findings);
  const summary = summarizeFindings(sortedFlat);
  const includeRf = !!options?.includeRuleFamily;

  const summaryOut: Record<string, unknown> = { ...summary };
  if (options?.benchmarkMetadata) {
    summaryOut.findingsPerFile = findingsPerFileCounts(sortedFlat);
  }

  const payload: Record<string, unknown> = {
    summary: summaryOut,
    routes: project.routes,
    routeInventory: project.routeInventory,
    openApiSpecsUsed: project.openApiSpecsUsed,
    buildId: project.buildId,
    packageJsonPath: project.packageJsonPath,
    findings: sortedFlat.map((f) => findingToJson(f, undefined, includeRf, true)),
    fileResults: project.fileResults.map((r) => ({
      filePath: r.filePath,
      file: r.filePath,
      findings: sortFindingsStable(r.findings).map((f) => findingToJson(f, r.filePath, includeRf, true)),
      routeCount: r.routes?.length ?? 0,
    })),
  };

  if (options?.benchmarkMetadata) {
    payload.run = {
      toolVersion: options.toolVersion ?? readScannerPackageVersion(),
      timestamp: new Date().toISOString(),
      gitCommit: options.gitCommit ?? null,
      scanOptions: options.scanOptions ?? {},
    };
  }

  return JSON.stringify(payload, null, 2);
}
