import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectScanResult, Finding, ScanResult } from "./types.js";
import { findingDisplayFile } from "./format.js";

function toolVersion(): string {
  try {
    const pkgPath = join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function severityToLevel(s: Finding["severity"]): "error" | "warning" | "note" | "none" {
  if (s === "critical" || s === "error") return "error";
  if (s === "warning") return "warning";
  return "note";
}

function collectRuleIds(findings: Finding[]): Map<string, Finding> {
  const m = new Map<string, Finding>();
  for (const f of findings) {
    if (!m.has(f.ruleId)) m.set(f.ruleId, f);
  }
  return m;
}

export function scanResultsToProjectForSarif(results: ScanResult[]): ProjectScanResult {
  const findings: Finding[] = [];
  for (const r of results) {
    for (const f of r.findings) {
      findings.push({ ...f, filePath: f.filePath ?? r.filePath });
    }
  }
  return {
    fileResults: results,
    routes: [],
    findings,
    packageJsonPath: undefined,
  };
}

export function formatProjectSarif(project: ProjectScanResult): string {
  const findings = project.findings;
  const ruleMap = collectRuleIds(findings);
  const rules = [...ruleMap.entries()].map(([id, sample]) => ({
    id,
    name: id,
    shortDescription: { text: sample.message.slice(0, 256) },
    fullDescription: { text: sample.message },
    properties: {
      tags: ["security", sample.category, ...(sample.cwe != null ? [`CWE-${sample.cwe}`] : [])],
    },
  }));

  const results = findings.map((f) => {
    const uri = findingDisplayFile(f) || "unknown";
    const line = Math.max(1, f.line || 1);
    return {
      ruleId: f.ruleId,
      level: severityToLevel(f.severity),
      message: { text: f.message },
      properties: {
        category: f.category,
        cwe: f.cwe,
        remediation: f.remediation ?? f.fix,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri },
            region: { startLine: line, startColumn: f.column > 0 ? f.column : undefined },
          },
        },
      ],
    };
  });

  const runProps: Record<string, unknown> = {};
  if (project.routeInventory && project.routeInventory.length > 0) {
    runProps.vibescanRouteInventory = project.routeInventory;
  }
  if (project.openApiSpecsUsed && project.openApiSpecsUsed.length > 0) {
    runProps.vibescanOpenApiSpecsUsed = project.openApiSpecsUsed;
  }
  if (project.buildId) {
    runProps.vibescanBuildId = project.buildId;
  }

  const run: Record<string, unknown> = {
    tool: {
      driver: {
        name: "VibeScan",
        version: toolVersion(),
        informationUri: "https://github.com/Joshober/cybersecurity-scanner",
        rules,
      },
    },
    results,
  };
  if (Object.keys(runProps).length > 0) {
    run.properties = runProps;
  }

  const doc = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [run],
  };

  return JSON.stringify(doc, null, 2);
}
