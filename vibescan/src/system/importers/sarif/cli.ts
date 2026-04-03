/**
 * CLI: vibescan import-sarif <file.sarif> [--output <out.json>]
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { importSarifFromFile } from "./importSarif.js";

export function runImportSarifCli(argv: string[]): number {
  const args = [...argv];
  let outPath: string | undefined;
  const pos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outPath = resolve(args[++i]);
      continue;
    }
    if (!args[i].startsWith("-")) pos.push(args[i]);
  }
  const sarifPath = pos[0];
  if (!sarifPath) {
    console.error("Usage: vibescan import-sarif <results.sarif> [--output <vibescan-import.json>]");
    return 1;
  }
  const resolved = resolve(sarifPath);
  const data = importSarifFromFile(resolved);
  const defaultOut = resolved.replace(/\.sarif$/i, ".vibescan-import.json");
  const target = outPath ?? defaultOut;
  writeFileSync(target, JSON.stringify(data, null, 2), "utf-8");
  console.error(`Wrote ${target} (${data.findings.length} findings from ${data.tool.name})`);
  return 0;
}
