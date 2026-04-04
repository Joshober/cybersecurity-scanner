#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { runArchitectureCheck, shouldFail } from "@secure-arch/core";
import { runAdapter, type SupportedTool } from "@secure-arch/adapters";
import { ensureGitignorePatterns } from "./gitignore.js";
import { installRulepack } from "./installRulepack.js";

function printHelp(): void {
  console.log(`
secure-arch — universal secure-architecture rule system

Commands:
  install [--root <dir>] [--settings <path>] [--force]
      Copy templates and schema into <root>/<settings>/; update .gitignore.

  init --tool <cursor|amazonq> [--root <dir>] [--settings <path>]
      Generate AI tool instruction files (no security logic).

  check [--root <dir>] [--settings <path>] [--code-evidence off|js-ts|all]
        [--paths <globOrDir> ...] [--format human|json]

Options:
  --root          Project root (default: cwd)
  --settings      Settings directory relative to root (default: vibescan/architecture/secure-rules)
  --force         Overwrite templates on install
  --code-evidence off | js-ts | all   (default: js-ts)
  --paths         Extra scan paths for code evidence (default: .)

Environment:
  CI=1  Disables color in human output
`);
}

function parseArgs(argv: string[]): Record<string, string | boolean | string[]> {
  const out: Record<string, string | boolean | string[]> = {};
  const paths: string[] = [];
  let i = 0;
  if (argv[0] && !argv[0].startsWith("-")) {
    out._cmd = argv[0];
    i = 1;
  }
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root" && argv[i + 1]) out.root = argv[++i];
    else if (a === "--settings" && argv[i + 1]) out.settings = argv[++i];
    else if (a === "--tool" && argv[i + 1]) out.tool = argv[++i];
    else if (a === "--code-evidence" && argv[i + 1]) out.codeEvidence = argv[++i];
    else if (a === "--format" && argv[i + 1]) out.format = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--paths") {
      const acc: string[] = Array.isArray(out.paths) ? [...(out.paths as string[])] : [];
      while (argv[i + 1] && !argv[i + 1].startsWith("-")) acc.push(argv[++i]);
      out.paths = acc;
    }
  }
  return out;
}

type CodeEv = "off" | "js-ts" | "all";

function parseCodeEv(v: unknown): CodeEv {
  const s = String(v ?? "js-ts").toLowerCase();
  if (s === "off" || s === "false" || s === "none") return "off";
  if (s === "all" || s === "on") return "all";
  return "js-ts";
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }

  const args = parseArgs(argv);
  const cmd = String(args._cmd ?? "");
  const projectRoot = resolve(process.cwd(), String(args.root ?? "."));
  const settingsRelative = String(args.settings ?? "vibescan/architecture/secure-rules");
  const settingsDir = join(projectRoot, settingsRelative);

  if (cmd === "install") {
    const { copied, skipped } = installRulepack({
      projectRoot,
      settingsRelativeDir: settingsRelative,
      force: Boolean(args.force),
    });
    const gi = ensureGitignorePatterns(projectRoot);
    console.log(`secure-arch install: copied ${copied.length} path(s), skipped ${skipped.length}.`);
    if (gi.changed) console.log(`Updated .gitignore: ${gi.path}`);
    process.exit(0);
  }

  if (cmd === "init") {
    const tool = String(args.tool ?? "").toLowerCase() as SupportedTool;
    if (tool !== "cursor" && tool !== "amazonq") {
      console.error('init requires --tool cursor|amazonq');
      process.exit(2);
    }
    const result = runAdapter(tool, { projectRoot, settingsRelativeDir: settingsRelative });
    for (const f of result.files) {
      const dest = join(projectRoot, f.relativePath);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, f.content, "utf-8");
      console.log(`Wrote ${f.relativePath}`);
    }
    if (result.note) console.log(result.note);
    process.exit(0);
  }

  if (cmd === "check") {
    const codeEvidence = parseCodeEv(args.codeEvidence);
    const scanPaths = Array.isArray(args.paths) ? (args.paths as string[]) : ["."];
    const format = String(args.format ?? "human").toLowerCase();

    let result;
    try {
      result = await runArchitectureCheck({
        settingsDir,
        projectRoot,
        codeEvidence,
        scanPaths,
      });
    } catch (e) {
      console.error(String(e instanceof Error ? e.message : e));
      process.exit(2);
    }

    if (result.schemaErrors.length) {
      for (const se of result.schemaErrors) {
        console.error(`Schema errors in ${se.file}:`);
        for (const er of se.errors) console.error(`  ${er.path}: ${er.message}`);
      }
      process.exit(2);
    }

    if (format === "json") {
      console.log(
        JSON.stringify(
          {
            loadedSettingsFiles: result.loadedSettingsFiles,
            findings: result.findings,
            failed: shouldFail(result.findings),
          },
          null,
          2
        )
      );
    } else {
      console.log(`Settings: ${result.loadedSettingsFiles.join(", ") || "(none)"}`);
      if (result.findings.length === 0) {
        console.log("No architecture findings.");
      } else {
        for (const f of result.findings) {
          const ev = f.evidence?.length ? ` [${f.evidence.join("; ")}]` : "";
          console.log(`[${f.severity.toUpperCase()}] ${f.ruleId}: ${f.message}${ev}`);
          if (f.environment) console.log(`  env: ${f.environment}`);
          if (f.settingsPath) console.log(`  settings: ${f.settingsPath}`);
          if (f.remediation) console.log(`  fix: ${f.remediation}`);
        }
      }
    }

    process.exit(shouldFail(result.findings) ? 1 : 0);
  }

  printHelp();
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
