/**
 * Native project scan + SARIF import: prefer native findings at same location, append unmatched imports.
 */

import { readFileSync } from "node:fs";
import { resolve, normalize } from "node:path";
import type { Finding, Severity, SeverityLabel, Category } from "../../types.js";
import { scanProject } from "../../scanner.js";
import { collectScanFiles } from "../../cli/collectFiles.js";
import { importSarifFromFile, type ImportedFindingRow } from "./importSarif.js";
import { loadSarifRuleMapFile, resolveRuleMapPath } from "./ruleMap.js";
import { emitProofTests } from "../../proof/pipeline.js";
import { formatProjectJson, type FormatProjectJsonOptions } from "../../format.js";
import type { ScannerOptions } from "../../types.js";

function normPath(p: string | undefined): string {
  if (!p) return "";
  try {
    return normalize(p).replace(/\\/g, "/");
  } catch {
    return p;
  }
}

function locKey(filePath: string | undefined, line: number): string {
  return `${normPath(filePath)}:${line}`;
}

function importedToFinding(row: ImportedFindingRow): Finding {
  return {
    ruleId: row.ruleId,
    message: row.message,
    severity: row.severity as Severity,
    severityLabel: row.severityLabel as SeverityLabel,
    category: row.category as Category,
    line: row.line,
    column: row.column,
    filePath: row.filePath ?? row.file,
    proofGeneration: row.proofGeneration,
  };
}

export interface MergeSarifProjectOptions {
  projectRoot: string;
  sarifPath: string;
  ruleMapPath?: string;
  /** Write generated proof tests here after merge (optional). */
  emitProofsDir?: string;
  scan?: Partial<ScannerOptions>;
  format?: FormatProjectJsonOptions;
}

/**
 * Run native scan, import SARIF with optional rule map, drop imports that collide on location with native findings, optional proofs.
 */
export function mergeSarifWithProjectScan(options: MergeSarifProjectOptions): {
  projectJson: string;
  nativeFindingsCount: number;
  importedTotal: number;
  importedAppended: number;
} {
  const root = resolve(options.projectRoot);
  const scanOpts: ScannerOptions = {
    projectRoot: root,
    excludeVendor: true,
    ...options.scan,
  };
  const paths = collectScanFiles([root], scanOpts);
  const files = paths.map((path) => ({
    path,
    source: readFileSync(path, "utf-8"),
  }));
  const project = scanProject(files, scanOpts);

  const mapPath = resolveRuleMapPath(root, options.ruleMapPath);
  const ruleMap = mapPath ? loadSarifRuleMapFile(mapPath) : [];
  const sarifResolved = resolve(options.sarifPath);
  const imported = importSarifFromFile(sarifResolved, { ruleMap });

  const nativeKeys = new Set<string>();
  for (const f of project.findings) {
    nativeKeys.add(locKey(f.filePath, f.line));
  }

  const merged: Finding[] = [...project.findings];
  let appended = 0;
  for (const row of imported.findings) {
    const k = locKey(row.filePath ?? row.file, row.line);
    if (nativeKeys.has(k)) continue;
    merged.push(importedToFinding(row));
    appended++;
  }

  if (options.emitProofsDir) {
    const outDir = resolve(options.emitProofsDir);
    emitProofTests(merged, outDir, { projectRoot: root });
  }

  const payload = formatProjectJson(
    {
      ...project,
      findings: merged,
    },
    options.format
  );
  return {
    projectJson: payload,
    nativeFindingsCount: project.findings.length,
    importedTotal: imported.findings.length,
    importedAppended: appended,
  };
}
