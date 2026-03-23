import { loadArchitectureSettings } from "./loadSettings.js";
import { runSettingsChecks } from "./checks/settingsChecks.js";
import { runJsTsEvidence } from "./evidence/jsTsEvidence.js";
import { runHeuristicEvidence } from "./evidence/heuristicEvidence.js";
import type { ArchitectureFinding, CodeEvidenceMode } from "./types.js";
import type { SchemaError } from "./schema.js";

export interface RunArchitectureCheckOptions {
  settingsDir: string;
  projectRoot: string;
  codeEvidence: CodeEvidenceMode;
  scanPaths: string[];
}

export interface RunArchitectureCheckResult {
  findings: ArchitectureFinding[];
  schemaErrors: { file: string; errors: SchemaError[] }[];
  loadedSettingsFiles: string[];
}

function severityOrder(s: ArchitectureFinding["severity"]): number {
  const m: Record<ArchitectureFinding["severity"], number> = {
    critical: 4,
    error: 3,
    warning: 2,
    info: 1,
  };
  return m[s];
}

function shouldFail(findings: ArchitectureFinding[]): boolean {
  return findings.some((f) => f.severity === "critical" || f.severity === "error");
}

export { shouldFail };

export async function runArchitectureCheck(opts: RunArchitectureCheckOptions): Promise<RunArchitectureCheckResult> {
  const { facts, schemaErrors, loadedFiles } = loadArchitectureSettings(opts.settingsDir);
  const settingsFindings = runSettingsChecks({ facts, settingsDir: opts.settingsDir });

  const evidenceFindings: ArchitectureFinding[] = [];
  if (opts.codeEvidence === "js-ts" || opts.codeEvidence === "all") {
    evidenceFindings.push(...(await runJsTsEvidence(opts.projectRoot, opts.scanPaths)));
  }
  if (opts.codeEvidence === "all") {
    evidenceFindings.push(...runHeuristicEvidence(opts.projectRoot, opts.scanPaths));
  }

  const findings = [...settingsFindings, ...evidenceFindings].sort(
    (a, b) => severityOrder(b.severity) - severityOrder(a.severity)
  );

  return {
    findings,
    schemaErrors,
    loadedSettingsFiles: loadedFiles,
  };
}
