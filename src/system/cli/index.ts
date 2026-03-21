#!/usr/bin/env node

// CLI: secure scan [paths...] — project scan, optional registry check, generated tests.

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import fg from "fast-glob";
import { scanAsync, scanProjectAsync } from "../scanner.js";
import {
  formatHuman,
  formatCompact,
  formatJson,
  formatProjectJson,
  projectFindingsToScanResults,
} from "../format.js";
import type { ScannerOptions, Severity, ScanMode, Finding } from "../types.js";

const args = process.argv.slice(2);
let subcommand = "";
let inputPaths: string[] = [];
let options: ScannerOptions = { crypto: true, injection: true };
let format: "human" | "compact" | "json" = "compact";
let fixSuggestions = false;
let useColor = process.stdout.isTTY;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "scan") {
    subcommand = "scan";
    continue;
  }
  if (a === "--mode" && args[i + 1]) {
    const m = args[++i].toLowerCase();
    if (m === "static" || m === "ai") options.mode = m as ScanMode;
  } else if (a === "--ai-api-url" && args[i + 1]) {
    options.ai = { ...options.ai, apiUrl: args[++i] };
  } else if (a === "--ai-api-key" && args[i + 1]) {
    options.ai = { ...options.ai, apiKey: args[++i] };
  } else if (a === "--ai-model" && args[i + 1]) {
    options.ai = { ...options.ai, model: args[++i] };
  } else if (a === "--no-crypto") options = { ...options, crypto: false };
  else if (a === "--no-injection") options = { ...options, injection: false };
  else if (a === "--rules" && args[i + 1]) {
    const val = args[++i].toLowerCase();
    options.crypto = val.includes("crypto");
    options.injection = val.includes("injection");
  } else if (a === "--severity" && args[i + 1]) {
    const s = args[++i].toLowerCase();
    if (["critical", "error", "warning", "info"].includes(s)) options.severityThreshold = s as Severity;
  } else if (a === "--format" && args[i + 1]) {
    const f = args[++i].toLowerCase();
    if (f === "json") format = "json";
    else if (f === "human") format = "human";
    else format = "compact";
  } else if (a === "--fix-suggestions") fixSuggestions = true;
  else if (a === "--check-registry") options.checkRegistry = true;
  else if (a === "--skip-registry") options.skipRegistry = true;
  else if (a === "--generate-tests") {
    options.generateTests = true;
    if (args[i + 1] && !args[i + 1].startsWith("-")) {
      options.generateTestsOutputDir = resolve(args[++i]);
    } else {
      options.generateTestsOutputDir = join(process.cwd(), "vibescan-generated-tests");
    }
  } else if (a === "--project-root" && args[i + 1]) {
    options.projectRoot = resolve(args[++i]);
  } else if (a === "--color" && args[i + 1]) {
    const v = args[++i].toLowerCase();
    useColor = v === "always" ? true : v === "never" ? false : process.stdout.isTTY;
  } else if (!a.startsWith("-")) {
    if (subcommand === "scan") inputPaths.push(a);
    else if (!subcommand) {
      subcommand = "scan";
      inputPaths.push(a);
    }
  }
}

if (!subcommand || (subcommand === "scan" && inputPaths.length === 0)) {
  if (subcommand === "scan") inputPaths.push(".");
}

const showHelp = (): void => {
  console.log(`
secure — Static analysis for crypto failures and injection risks

Usage:
  secure scan [paths...] [options]

Options:
  --mode static|ai
  --rules crypto,injection
  --no-crypto / --no-injection
  --severity critical|error|warning|info
  --format human|compact|json
  --fix-suggestions
  --check-registry     HEAD npm registry for missing packages (slopsquat signal)
  --skip-registry      Skip registry checks
  --generate-tests [dir]  Emit stub tests under dir (default: ./vibescan-generated-tests)
  --project-root <dir>    package.json resolution for registry check
  --color always|never|auto
  --ai-api-url, --ai-api-key, --ai-model
`);
};

if (inputPaths.length === 0) {
  showHelp();
  process.exit(0);
}

const files: string[] = [];
for (const p of inputPaths) {
  const resolved = resolve(p);
  if (existsSync(resolved)) {
    try {
      const stat = statSync(resolved);
      if (stat.isFile()) files.push(resolved);
      else if (stat.isDirectory()) {
        const found = fg.sync(["**/*.js", "**/*.ts", "**/*.mjs", "**/*.cjs"], {
          cwd: resolved,
          absolute: true,
        });
        files.push(...found);
      }
    } catch {
      const matched = fg.sync(p, { absolute: true });
      files.push(...matched);
    }
  } else {
    const matched = fg.sync(p, { absolute: true });
    files.push(...matched);
  }
}

if (files.length === 0 && inputPaths.length > 0) {
  console.error("No files found for:", inputPaths.join(", "));
  process.exit(1);
}

function findingsFail(fs: Finding[]): boolean {
  return fs.some((f) => f.severity === "critical" || f.severity === "error");
}

const useAi = options.mode === "ai";

async function main(): Promise<void> {
  let exitCode = 0;

  if (useAi) {
    console.log(`Scanning ${files.length} file${files.length === 1 ? "" : "s"} (AI mode)...`);
    const results: import("../types.js").ScanResult[] = [];
    for (const file of files) {
      const path = resolve(file);
      if (!existsSync(path)) continue;
      const source = readFileSync(path, "utf-8");
      const result = await scanAsync(source, path, options);
      results.push(result);
      if (findingsFail(result.findings)) exitCode = 1;
    }
    const totalFindings = results.reduce((n, r) => n + r.findings.length, 0);
    if (totalFindings === 0) {
      console.log("No vulnerabilities found.");
      process.exit(0);
    }
    console.log(`\n${totalFindings} vulnerabilit${totalFindings === 1 ? "y" : "ies"} found\n`);
    if (format === "human") console.log(formatHuman(results, useColor));
    else if (format === "json") console.log(formatJson(results));
    else console.log(formatCompact(results, useColor));
    if (fixSuggestions && format !== "human" && totalFindings > 0) {
      console.log("\n--- Fix suggestions ---");
      for (const r of results) {
        for (const f of r.findings) {
          const remed = f.remediation ?? f.fix;
          if (remed) console.log(`[${f.ruleId}] ${remed}`);
        }
      }
    }
    process.exit(exitCode);
    return;
  }

  console.log(`Scanning ${files.length} file${files.length === 1 ? "" : "s"}...`);
  const entries = files.map((path) => ({
    path: resolve(path),
    source: readFileSync(resolve(path), "utf-8"),
  }));
  const projectRoot =
    options.projectRoot ??
    (inputPaths.length > 0 ? resolve(inputPaths[0]) : process.cwd());
  const project = await scanProjectAsync(entries, options, projectRoot);

  if (findingsFail(project.findings)) exitCode = 1;

  const totalFindings = project.findings.length;
  if (totalFindings === 0) {
    console.log("No vulnerabilities found.");
    process.exit(0);
  }

  console.log(`\n${totalFindings} vulnerabilit${totalFindings === 1 ? "y" : "ies"} found\n`);

  if (format === "json") {
    console.log(formatProjectJson(project));
  } else {
    const display = projectFindingsToScanResults(project);
    if (format === "human") console.log(formatHuman(display, useColor));
    else console.log(formatCompact(display, useColor));
  }

  if (fixSuggestions && format !== "human" && totalFindings > 0) {
    console.log("\n--- Fix suggestions ---");
    for (const f of project.findings) {
      const remed = f.remediation ?? f.fix;
      if (remed) console.log(`[${f.ruleId}] ${remed}`);
    }
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
