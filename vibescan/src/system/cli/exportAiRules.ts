// Top-level `vibescan export-ai-rules` — reads vibescan.config.json + secure-arch paths, writes AI tool files.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  findVibeScanConfigFile,
  loadVibeScanConfigFile,
  type VibeScanFileConfig,
} from "./vibescanConfig.js";

type SupportedTool = "cursor" | "amazonq";

interface AdapterResult {
  files: { relativePath: string; content: string }[];
  note?: string;
}

type RunAdapterFn = (
  tool: SupportedTool,
  opts: { projectRoot: string; settingsRelativeDir: string }
) => AdapterResult;

async function loadRunAdapter(cliDir: string): Promise<RunAdapterFn> {
  const adaptersEntry = join(cliDir, "../../node_modules/@secure-arch/adapters/dist/index.js");
  if (!existsSync(adaptersEntry)) {
    throw new Error(`Missing vendored @secure-arch/adapters (run prepublish / vendor script): ${adaptersEntry}`);
  }
  const mod = (await import(pathToFileURL(adaptersEntry).href)) as { runAdapter: RunAdapterFn };
  return mod.runAdapter;
}

function parseExportArgs(argv: string[]): {
  tool?: SupportedTool;
  root?: string;
  settings?: string;
  help?: boolean;
} {
  const out: ReturnType<typeof parseExportArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--tool" && argv[i + 1]) {
      const t = argv[++i].toLowerCase();
      if (t === "cursor" || t === "amazonq") out.tool = t;
    } else if (a === "--root" && argv[i + 1]) out.root = argv[++i];
    else if (a === "--settings" && argv[i + 1]) out.settings = argv[++i];
  }
  return out;
}

export function printExportAiRulesHelp(): void {
  console.log(`
vibescan export-ai-rules — write AI editor rule files from project config

Reads optional vibescan.config.json (for defaults) and uses the secure-arch
settings directory path (YAML policy / architecture files).

Usage:
  vibescan export-ai-rules --tool cursor|amazonq [--root <dir>] [--settings <rel>]

Options:
  --tool       cursor | amazonq (or set aiExport.tool in vibescan.config.json)
  --root       Project root (default: current directory)
  --settings   secure-arch folder relative to root (default: architecture/secure-rules
               or aiExport.settings in vibescan.config.json)

When vibescan.config.json exists and --tool cursor, also writes
.cursor/rules/vibescan-static-scan.mdc summarizing scanner options.
`);
}

function vibescanStaticScanMdc(cfg: VibeScanFileConfig | null): { relativePath: string; content: string } | null {
  if (!cfg) return null;
  const lines: string[] = [
    "---",
    "description: VibeScan static scanner — run in CI and locally (no API keys)",
    "globs:",
    "  - \"**/*.{js,mjs,cjs,ts,tsx}\"",
    "alwaysApply: false",
    "---",
    "",
    "# VibeScan (from vibescan.config.json)",
    "",
    "This project uses **VibeScan** for JS/TS crypto and injection static analysis.",
    "",
    "## When editing application code",
    "",
    "- Prefer fixes that satisfy existing **vibescan.config.json** (rules, severity, ignores).",
    "- Suggest running: `vibescan scan . --exclude-vendor` (or `npx @jobersteadt/vibescan@latest scan .`).",
  ];
  if (cfg.rules) {
    lines.push(`- Rules enabled: crypto=${cfg.rules.crypto !== false}, injection=${cfg.rules.injection !== false}.`);
  }
  if (cfg.severityThreshold) {
    lines.push(`- Severity threshold: ${cfg.severityThreshold}.`);
  }
  if (cfg.openApiSpecPaths?.length) {
    lines.push(`- OpenAPI paths (from config): ${cfg.openApiSpecPaths.join(", ")}.`);
  }
  lines.push("");
  lines.push("Do not claim the tree is fully audited — the CLI reports findings; humans triage.");
  return { relativePath: ".cursor/rules/vibescan-static-scan.mdc", content: lines.join("\n") };
}

/** @param cliDir __dirname of the compiled dispatcher (…/dist/system/cli) */
export async function runExportAiRulesCliAsync(argv: string[], cliDir: string): Promise<number> {
  const parsed = parseExportArgs(argv);
  if (parsed.help) {
    printExportAiRulesHelp();
    return 0;
  }

  const projectRoot = resolve(process.cwd(), parsed.root ?? ".");
  const cfgPath = findVibeScanConfigFile(projectRoot);
  const fileCfg: VibeScanFileConfig | null = cfgPath ? loadVibeScanConfigFile(cfgPath) : null;

  const settingsRelative =
    parsed.settings ??
    (fileCfg?.aiExport && typeof fileCfg.aiExport.settings === "string" ? fileCfg.aiExport.settings : undefined) ??
    "architecture/secure-rules";

  let tool = parsed.tool;
  if (!tool && fileCfg?.aiExport?.tool) {
    const t = fileCfg.aiExport.tool.toLowerCase();
    if (t === "cursor" || t === "amazonq") tool = t;
  }

  if (!tool) {
    console.error("export-ai-rules: pass --tool cursor|amazonq or set aiExport.tool in vibescan.config.json");
    printExportAiRulesHelp();
    return 2;
  }

  try {
    const runAdapter = await loadRunAdapter(cliDir);
    const result = runAdapter(tool, { projectRoot, settingsRelativeDir: settingsRelative });

    for (const f of result.files) {
      const dest = join(projectRoot, f.relativePath);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, f.content, "utf-8");
      console.log(`Wrote ${f.relativePath}`);
    }

    if (tool === "cursor" && fileCfg) {
      const extra = vibescanStaticScanMdc(fileCfg);
      if (extra) {
        const dest = join(projectRoot, extra.relativePath);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, extra.content, "utf-8");
        console.log(`Wrote ${extra.relativePath}`);
      }
    }

    if (result.note) console.log(result.note);
    return 0;
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return 1;
  }
}
