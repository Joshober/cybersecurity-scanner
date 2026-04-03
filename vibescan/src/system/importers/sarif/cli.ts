/**
 * CLI: vibescan import-sarif <file.sarif> [--output <out.json>]
 *   [--project <root>] [--rule-map <map.json>] [--emit-proofs <dir>]
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { importSarifFromFile } from "./importSarif.js";
import { loadSarifRuleMapFile, resolveRuleMapPath, type SarifRuleMapEntry } from "./ruleMap.js";
import { mergeSarifWithProjectScan } from "./mergeSarifProject.js";

export function runImportSarifCli(argv: string[]): number {
  const args = [...argv];
  let outPath: string | undefined;
  let projectRoot: string | undefined;
  let ruleMapPath: string | undefined;
  let emitProofsDir: string | undefined;
  const pos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outPath = resolve(args[++i]);
      continue;
    }
    if (args[i] === "--project" && args[i + 1]) {
      projectRoot = resolve(args[++i]);
      continue;
    }
    if (args[i] === "--rule-map" && args[i + 1]) {
      ruleMapPath = resolve(args[++i]);
      continue;
    }
    if (args[i] === "--emit-proofs" && args[i + 1]) {
      emitProofsDir = resolve(args[++i]);
      continue;
    }
    if (!args[i].startsWith("-")) pos.push(args[i]);
  }
  const sarifPath = pos[0];
  if (!sarifPath) {
    console.error(
      "Usage: vibescan import-sarif <results.sarif> [--output <out.json>] [--project <root> [--rule-map <map.json>] [--emit-proofs <dir>]]"
    );
    return 1;
  }
  const resolved = resolve(sarifPath);

  if (projectRoot) {
    const merged = mergeSarifWithProjectScan({
      projectRoot,
      sarifPath: resolved,
      ruleMapPath,
      emitProofsDir,
      format: { benchmarkMetadata: true, includeRuleFamily: true },
    });
    const defaultOut = resolved.replace(/\.sarif$/i, ".vibescan-merge.json");
    const target = outPath ?? defaultOut;
    writeFileSync(target, merged.projectJson, "utf-8");
    console.error(
      `Wrote ${target} (native ${merged.nativeFindingsCount} findings; SARIF ${merged.importedTotal}; appended ${merged.importedAppended} non-colliding imports)`
    );
    return 0;
  }

  let mapEntries: SarifRuleMapEntry[] = [];
  if (ruleMapPath) {
    mapEntries = loadSarifRuleMapFile(resolve(ruleMapPath));
  } else {
    const def = resolveRuleMapPath(process.cwd(), undefined);
    if (def) mapEntries = loadSarifRuleMapFile(def);
  }
  const data = importSarifFromFile(resolved, { ruleMap: mapEntries });
  const defaultOut = resolved.replace(/\.sarif$/i, ".vibescan-import.json");
  const target = outPath ?? defaultOut;
  writeFileSync(target, JSON.stringify(data, null, 2), "utf-8");
  console.error(`Wrote ${target} (${data.findings.length} findings from ${data.tool.name})`);
  return 0;
}
