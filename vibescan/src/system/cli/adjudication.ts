import { writeFileSync } from "node:fs";
import type { Finding } from "../types.js";
import { findingDisplayFile, findingToJson } from "../format.js";

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function writeAdjudicationExports(stem: string, findings: Finding[]): { jsonPath: string; csvPath: string } {
  const jsonPath = `${stem}.json`;
  const csvPath = `${stem}.csv`;
  const rows = findings.map((f) => findingToJson(f));
  writeFileSync(jsonPath, JSON.stringify(rows, null, 2), "utf-8");

  const headers = [
    "ruleId",
    "severity",
    "file",
    "line",
    "category",
    "cwe",
    "message",
    "remediation",
    "reviewerVerdict",
    "groundTruthId",
    "notes",
  ];
  const lines = [headers.join(",")];
  for (const f of findings) {
    const rem = f.remediation ?? f.fix ?? "";
    const cells = [
      f.ruleId,
      f.severity,
      findingDisplayFile(f),
      String(f.line),
      f.category,
      f.cwe != null ? String(f.cwe) : "",
      f.message,
      rem,
      "",
      "",
      "",
    ].map((c) => csvEscape(String(c)));
    lines.push(cells.join(","));
  }
  writeFileSync(csvPath, lines.join("\n"), "utf-8");
  return { jsonPath, csvPath };
}
