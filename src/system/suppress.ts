import type { Finding } from "./types.js";
import { findingDisplayFile } from "./format.js";
import type { SuppressionRule } from "./cli/vibescanConfig.js";

export function applySuppressions(findings: Finding[], rules: SuppressionRule[]): Finding[] {
  if (!rules.length) return findings;
  return findings.filter((f) => !rules.some((r) => matchesSuppression(f, r)));
}

function fileMatchesPattern(fileNorm: string, needle: string): boolean {
  const n = needle.replace(/\\/g, "/");
  return fileNorm === n || fileNorm.endsWith("/" + n) || fileNorm.endsWith(n);
}

function matchesSuppression(f: Finding, r: SuppressionRule): boolean {
  const hasRule = r.ruleId != null && r.ruleId !== "";
  const hasFile = r.file != null && r.file !== "";
  const hasLine = r.line != null;
  if (!hasRule && !hasFile && !hasLine) return false;
  if (hasLine && !hasRule && !hasFile) return false;

  if (hasRule && f.ruleId !== r.ruleId) return false;
  if (hasLine && f.line !== r.line) return false;
  if (hasFile) {
    const norm = findingDisplayFile(f).replace(/\\/g, "/");
    if (!fileMatchesPattern(norm, r.file!)) return false;
  }
  return true;
}
