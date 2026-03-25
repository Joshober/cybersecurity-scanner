// Optional npm audit JSON → VibeScan findings (SCA / known CVE surface). Requires npm on PATH.

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Finding, Severity, SeverityLabel, Category } from "./types.js";

const SEVERITY_LABEL: Record<Severity, SeverityLabel> = {
  critical: "CRITICAL",
  error: "HIGH",
  warning: "MEDIUM",
  info: "LOW",
};

const RULE_ID = "supply_chain.npm_audit";
const MAX_FINDINGS = 80;

function npmSeverityToSeverity(s: string): Severity {
  const x = String(s || "").toLowerCase();
  if (x === "critical") return "critical";
  if (x === "high") return "error";
  if (x === "moderate" || x === "medium") return "warning";
  if (x === "low") return "info";
  return "info";
}

function lineOfDependencyInFile(filePath: string, depName: string): number {
  if (!existsSync(filePath)) return 1;
  try {
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    const needle = new RegExp(`["']${escapeRe(depName)}["']\\s*:`);
    for (let i = 0; i < lines.length; i++) {
      if (needle.test(lines[i]!)) return i + 1;
    }
  } catch {
    /* ignore */
  }
  return 1;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectCvesFromVia(via: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(via)) return out;
  for (const item of via) {
    if (typeof item === "string") {
      const m = item.match(/^CVE-\d{4}-\d+$/i);
      if (m) out.push(m[0]!.toUpperCase());
    } else if (item && typeof item === "object") {
      const v = item as { vulnerability?: string };
      if (typeof v.vulnerability === "string") {
        const m = v.vulnerability.match(/^CVE-\d{4}-\d+$/i);
        if (m) out.push(m[0]!.toUpperCase());
      }
    }
  }
  return [...new Set(out)];
}

function advisoryTitle(via: unknown): string | undefined {
  if (!Array.isArray(via)) return undefined;
  for (const item of via) {
    if (item && typeof item === "object") {
      const t = (item as { title?: string }).title;
      if (typeof t === "string" && t.trim()) return t.trim();
    }
  }
  return undefined;
}

/** Parse `npm audit --json` stdout into findings (stable rule id, file = package.json). */
export function parseNpmAuditJsonToFindings(
  stdout: string,
  packageJsonPath: string
): { findings: Finding[]; parseError?: string } {
  let data: unknown;
  try {
    data = stdout.trim() ? JSON.parse(stdout) : {};
  } catch {
    return { findings: [], parseError: "invalid_json" };
  }
  if (!data || typeof data !== "object") return { findings: [], parseError: "not_object" };

  const root = data as {
    vulnerabilities?: Record<string, NpmVulnEntry>;
    error?: { summary?: string };
  };
  if (root.error && typeof root.error.summary === "string" && !root.vulnerabilities) {
    return { findings: [], parseError: root.error.summary };
  }

  const vulns = root.vulnerabilities;
  if (!vulns || typeof vulns !== "object") return { findings: [] };

  const pkgDir = dirname(packageJsonPath);
  const lockPath = join(pkgDir, "package-lock.json");
  const displayPath = existsSync(lockPath) ? lockPath : packageJsonPath;

  const findings: Finding[] = [];
  const names = Object.keys(vulns).sort();

  for (const name of names) {
    if (findings.length >= MAX_FINDINGS) break;
    const entry = vulns[name];
    if (!entry || typeof entry !== "object") continue;

    const sev = npmSeverityToSeverity(String((entry as NpmVulnEntry).severity ?? "info"));
    const via = (entry as NpmVulnEntry).via;
    const cves = collectCvesFromVia(via);
    const title = advisoryTitle(via);
    const range = typeof (entry as NpmVulnEntry).range === "string" ? (entry as NpmVulnEntry).range : "";
    const fixAvailable = (entry as NpmVulnEntry).fixAvailable;
    const fixHint =
      fixAvailable === true
        ? "Run `npm audit fix` (review changes) or upgrade the dependency to a patched range."
        : "Review the advisory; upgrade or replace the dependency when a fix exists.";

    const msgParts = [`npm audit: vulnerable dependency "${name}"`];
    if (title) msgParts.push(`— ${title}`);
    else if (cves.length) msgParts.push(`— ${cves.join(", ")}`);
    if (range) msgParts.push(`(range: ${range})`);

    const line = lineOfDependencyInFile(packageJsonPath, name);

    const f: Finding = {
      ruleId: RULE_ID,
      message: msgParts.join(" "),
      why: "Dependency advisories come from the npm security database; they flag known CVEs affecting resolved versions.",
      remediation: fixHint,
      severity: sev,
      severityLabel: SEVERITY_LABEL[sev],
      category: "supply_chain" as Category,
      line,
      column: 1,
      filePath: displayPath,
      packageName: name,
      cveRef: cves.length ? cves : undefined,
      owasp: "A06:2021",
    };
    findings.push(f);
  }

  return { findings };
}

interface NpmVulnEntry {
  severity?: string;
  via?: unknown;
  range?: string;
  fixAvailable?: boolean;
}

export interface RunNpmAuditResult {
  findings: Finding[];
  /** stderr from npm, or skip reason */
  note?: string;
  exitCode: number | null;
}

/** Run `npm audit --json` in the directory containing package.json. */
export function runNpmAuditFindings(packageJsonPath: string): RunNpmAuditResult {
  const cwd = dirname(packageJsonPath);
  if (!existsSync(packageJsonPath)) {
    return { findings: [], note: "package.json not found", exitCode: null };
  }

  const r = spawnSync("npm", ["audit", "--json"], {
    cwd,
    encoding: "utf8",
    maxBuffer: 25 * 1024 * 1024,
    shell: process.platform === "win32",
  });

  const stdout = r.stdout ?? "";
  const stderr = (r.stderr ?? "").trim();

  const parsed = parseNpmAuditJsonToFindings(stdout, packageJsonPath);
  if (parsed.parseError && parsed.findings.length === 0) {
    return {
      findings: [],
      note: parsed.parseError + (stderr ? `: ${stderr.slice(0, 200)}` : ""),
      exitCode: r.status,
    };
  }

  return {
    findings: parsed.findings,
    note: stderr || undefined,
    exitCode: r.status,
  };
}
