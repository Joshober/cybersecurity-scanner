// Top-level `vibescan export-ai-rules` — governance-oriented AI rule export + JSON policy.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readScannerPackageVersion, ruleFamilyForRuleId } from "../format.js";
import { getRuleDocumentation, RULE_REFERENCE_README_ANCHOR } from "../ruleCatalog.js";
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

type EmitPart = "cursor" | "amazonq" | "markdown" | "policy";

function parseEmitList(s: string | undefined): Set<EmitPart> | "all" {
  if (!s || s.toLowerCase() === "all") return "all";
  const set = new Set<EmitPart>();
  for (const p of s.split(/[,\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    if (p === "cursor" || p === "amazonq" || p === "markdown" || p === "policy") set.add(p);
  }
  if (set.size === 0) return "all";
  return set;
}

function parseExportArgs(argv: string[]): {
  tool?: SupportedTool;
  root?: string;
  settings?: string;
  help?: boolean;
  emit?: string;
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
    else if (a === "--emit" && argv[i + 1]) out.emit = argv[++i];
  }
  return out;
}

function governancePreamble(meta: {
  projectRoot: string;
  settingsRelative: string;
  configPath: string | null;
}): string {
  const iso = new Date().toISOString();
  return [
    "<!--",
    `  Generated from your project's security policy.`,
    `  Sources: ${meta.configPath ?? "(no vibescan.config.json — using defaults)"}`,
    `  Secure-arch settings directory (relative to project): ${meta.settingsRelative}`,
    `  Regenerate: npx @jobersteadt/vibescan@latest export-ai-rules`,
    `  Generated at: ${iso}`,
    "-->",
    "",
  ].join("\n");
}

function wantsEmit(set: Set<EmitPart> | "all", part: EmitPart): boolean {
  return set === "all" || set.has(part);
}

function prependBanner(content: string, meta: Parameters<typeof governancePreamble>[0], style: "md" | "mdc"): string {
  const pre = governancePreamble(meta);
  if (style === "mdc") {
    const lines = content.split("\n");
    if (lines[0]?.trim() === "---") {
      const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
      if (end > 0) {
        const front = lines.slice(0, end + 1).join("\n");
        const body = lines.slice(end + 1).join("\n");
        return `${front}\n\n${pre}${body.replace(/^\n+/, "\n")}`;
      }
    }
  }
  return `${pre}${content}`;
}

function buildGenericMarkdown(
  cfg: VibeScanFileConfig | null,
  settingsRelative: string,
  configPath: string | null,
  version: string
): string {
  const doc = [
    governancePreamble({
      projectRoot: ".",
      settingsRelative,
      configPath,
    }),
    "# VibeScan + secure-arch — assistant governance",
    "",
    "Use this file as a **portable policy brief** for any coding assistant (ChatGPT, IDE agents, reviews).",
    "It is derived from **vibescan.config.json** and the **secure-arch** YAML directory — not hand-written ad copy.",
    "",
    "## Static analysis (VibeScan)",
    "",
    "- Run: `vibescan scan . --exclude-vendor` (or `npx @jobersteadt/vibescan@latest scan . --exclude-vendor`).",
    `- Package version this export was generated with: **${version}**.`,
    "",
    ...(cfg?.rules
      ? [
          "### Enabled rule families",
          `- Crypto rules: **${cfg.rules.crypto !== false}**`,
          `- Injection rules: **${cfg.rules.injection !== false}**`,
          "",
        ]
      : []),
    ...(cfg?.severityThreshold
      ? [`- Severity gate: **${cfg.severityThreshold}** (critical/error fail CI by default).`, ""]
      : []),
    ...(cfg?.registry?.checkRegistry
      ? ["- **npm registry / slopsquat check** is enabled — verify private packages are not false positives.", ""]
      : []),
    "## Architecture YAML (secure-arch)",
    "",
    `Maintain factual deployment data only under \`${settingsRelative}/\` (no secrets in-repo).`,
    "Validate with `vibescan secure-arch check --root .`.",
    "",
    "## Rule reference",
    "",
    `Canonical rule narratives: ${RULE_REFERENCE_README_ANCHOR}`,
    "",
    "## Differentiators (what VibeScan bundles)",
    "",
    "- **AI rule export** (this workflow) + optional Cursor/Amazon Q adapter files.",
    "- **Slopsquat-style registry signal** when enabled.",
    "- **Generated security test scaffolds** (`--generate-tests`) for risky routes and JWT/oracles.",
    "- **secure-arch** checks in the same installable CLI.",
    "",
  ];
  return doc.join("\n");
}

function buildPolicyJson(args: {
  projectRoot: string;
  configPath: string | null;
  fileCfg: VibeScanFileConfig | null;
  settingsRelative: string;
  version: string;
}): string {
  const policy = {
    schemaVersion: "1.0",
    kind: "vibescan.securityPolicyExport",
    generatedAt: new Date().toISOString(),
    generator: {
      package: "@jobersteadt/vibescan",
      version: args.version,
    },
    preamble:
      "Machine-readable compilation of project security policy inputs. " +
      "Regenerate with `vibescan export-ai-rules`.",
    sources: {
      vibescanConfig: args.configPath,
      secureArchSettingsDirRelative: args.settingsRelative,
    },
    vibescan: args.fileCfg ?? {},
    ruleCatalogVersion: "1",
    /** Stable taxonomy slice for integrators (subset). */
    ruleFamilies: [
      "crypto.secrets",
      "injection.ssrf",
      "supply_chain.registry",
      "auth.middleware",
      "api.inventory",
    ],
    references: {
      readmeRuleReference: RULE_REFERENCE_README_ANCHOR,
      ruleFamilyForExampleRuleIds: {
        SEC004: ruleFamilyForRuleId("SEC-004"),
        SLOP001: ruleFamilyForRuleId("SLOP-001"),
      },
    },
    documentationSample: {
      SEC004: getRuleDocumentation("SEC-004"),
      JWT: getRuleDocumentation("crypto.jwt.weak-secret-literal"),
    },
  };
  return JSON.stringify(policy, null, 2);
}

export function printExportAiRulesHelp(): void {
  console.log(`
vibescan export-ai-rules — governance-oriented AI + assistant policy export

Reads **vibescan.config.json** (optional) and secure-arch paths, then emits:

  • Cursor rules (**--emit cursor**) — .cursor/rules/secure-arch-settings.mdc
  • Amazon Q prompt (**--emit amazonq**) — docs/secure-arch/amazon-q-prompt.md
  • Generic markdown (**--emit markdown**) — vibescan-ai-governance.md
  • JSON policy (**--emit policy**) — vibescan.policy.json

Default **--emit all**. Files are prefixed with a banner: generated from project policy.

Usage:
  vibescan export-ai-rules [--emit all|cursor,amazonq,markdown,policy] [--tool cursor|amazonq]
           [--root <dir>] [--settings <rel>]

Options:
  --emit     Comma-separated outputs (default: all)
  --tool     When set with a partial --emit list, still limits to that tool for adapter files only
  --root     Project root (default cwd)
  --settings secure-arch folder relative to root (default: vibescan/architecture/secure-rules or aiExport.settings)

When config exists and Cursor rules are emitted, also writes .cursor/rules/vibescan-static-scan.mdc.
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
    "vibescan/architecture/secure-rules";

  const emit = parseEmitList(parsed.emit);
  const version = readScannerPackageVersion();
  const meta = { projectRoot, settingsRelative, configPath: cfgPath };

  const emitCursor = wantsEmit(emit, "cursor");
  const emitAmazonq = wantsEmit(emit, "amazonq");
  if (parsed.tool && parsed.emit == null && emit === "all") {
    console.error("Note: --tool is optional; default export includes cursor, amazonq, markdown, and policy JSON.");
  }

  try {
    const runAdapter = await loadRunAdapter(cliDir);

    if (emitCursor) {
      const result = runAdapter("cursor", { projectRoot, settingsRelativeDir: settingsRelative });
      for (const f of result.files) {
        const dest = join(projectRoot, f.relativePath);
        mkdirSync(dirname(dest), { recursive: true });
        const body = prependBanner(f.content, meta, "mdc");
        writeFileSync(dest, body, "utf-8");
        console.log(`Wrote ${f.relativePath}`);
      }
      if (result.note) console.log(result.note);
    }

    if (emitAmazonq) {
      const result = runAdapter("amazonq", { projectRoot, settingsRelativeDir: settingsRelative });
      for (const f of result.files) {
        const dest = join(projectRoot, f.relativePath);
        mkdirSync(dirname(dest), { recursive: true });
        const body = prependBanner(f.content, meta, "md");
        writeFileSync(dest, body, "utf-8");
        console.log(`Wrote ${f.relativePath}`);
      }
      if (result.note) console.log(result.note);
    }

    if (wantsEmit(emit, "markdown")) {
      const mdPath = join(projectRoot, "vibescan-ai-governance.md");
      const body = buildGenericMarkdown(fileCfg, settingsRelative, cfgPath, version);
      writeFileSync(mdPath, body, "utf-8");
      console.log(`Wrote vibescan-ai-governance.md`);
    }

    if (wantsEmit(emit, "policy")) {
      const polPath = join(projectRoot, "vibescan.policy.json");
      writeFileSync(
        polPath,
        buildPolicyJson({
          projectRoot,
          configPath: cfgPath,
          fileCfg,
          settingsRelative,
          version,
        }),
        "utf-8"
      );
      console.log(`Wrote vibescan.policy.json`);
    }

    if (emitCursor && fileCfg) {
      const extra = vibescanStaticScanMdc(fileCfg);
      if (extra) {
        const dest = join(projectRoot, extra.relativePath);
        mkdirSync(dirname(dest), { recursive: true });
        const body = prependBanner(extra.content, meta, "mdc");
        writeFileSync(dest, body, "utf-8");
        console.log(`Wrote ${extra.relativePath}`);
      }
    }

    return 0;
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return 1;
  }
}
