#!/usr/bin/env node

// CLI: run as secure, npx secure, or npm exec secure. Subcommand: scan (e.g. secure scan . or secure scan src --rules injection,crypto).

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import fg from "fast-glob";
import { scan, scanAsync } from "../scanner.js";
import { formatHuman, formatCompact, formatJson } from "../format.js";
import type { ScannerOptions, Severity, ScanMode } from "../types.js";

const args = process.argv.slice(2);
let subcommand = "";
let inputPaths: string[] = [];
let options: ScannerOptions = { crypto: true, injection: true };
let format: "human" | "compact" | "json" = "compact";
let fixSuggestions = false;

// Parse args: secure scan [paths...] [--mode static|ai] [--rules ...] [--format ...] [--fix-suggestions]
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
  else if (!a.startsWith("-")) {
    if (subcommand === "scan") inputPaths.push(a);
    else if (!subcommand) { subcommand = "scan"; inputPaths.push(a); }
  }
}

// When no subcommand or no paths given, use current dir or show help.
if (!subcommand || (subcommand === "scan" && inputPaths.length === 0)) {
  if (subcommand === "scan") inputPaths.push(".");
}

const showHelp = (): void => {
  console.log(`
secure — High-confidence static analysis for crypto failures and injection risks

Usage:
  secure scan [paths...] [options]
  npx secure scan .
  npx secure scan src --rules injection,crypto
  npx secure scan . --mode static
  npx secure scan . --mode ai
  npx secure scan . --format json
  npx secure scan . --fix-suggestions

Options:
  --mode <engine>    static (default) = LaTeX/rule-based AST checks; ai = LLM reads code and responds
  --rules <list>     Comma-separated: crypto, injection (default: both; static mode only)
  --no-crypto        Disable cryptography rules (static mode)
  --no-injection     Disable injection rules (static mode)
  --severity <level> Only report this and above: critical | error | warning | info
  --format <type>    Output: human (Why + Fix) | compact | json
  --fix-suggestions  Include fix guidance in output (always included in human format)
  --ai-api-url <url> AI endpoint (or SECURE_AI_API_URL env); default OpenAI chat completions
  --ai-api-key <key> API key (or SECURE_AI_API_KEY env)
  --ai-model <name>  Model name (e.g. gpt-4o-mini)

This tool does not promise full protection. It provides high-confidence detection,
clear explanations, and fix guidance. Use it to find risky patterns before runtime;
it cannot guarantee every code path is safe. OWASP treats cryptographic failures
and injection as major application risks — this scanner helps address them.
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
        const found = fg.sync(["**/*.js", "**/*.ts", "**/*.mjs", "**/*.cjs"], { cwd: resolved, absolute: true });
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

const results: import("../types.js").ScanResult[] = [];
let exitCode = 0;
const useAi = options.mode === "ai";

async function runScan(): Promise<void> {
  console.log(`Scanning ${files.length} file${files.length === 1 ? "" : "s"}...`);
  for (const file of files) {
    const path = resolve(file);
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf-8");
    const result = useAi ? await scanAsync(source, path, options) : scan(source, path, options);
    results.push(result);
    if (result.findings.some((f) => f.severity === "error" || f.severity === "critical")) exitCode = 1;
  }
}

async function main(): Promise<void> {
  await runScan();
  const totalFindings = results.reduce((n, r) => n + r.findings.length, 0);
  if (totalFindings === 0) {
    console.log("No vulnerabilities found.");
    process.exit(0);
  }
  console.log(`\n${totalFindings} vulnerabilit${totalFindings === 1 ? "y" : "ies"} found\n`);
  if (format === "human") {
    console.log(formatHuman(results));
  } else if (format === "json") {
    console.log(formatJson(results));
  } else {
    console.log(formatCompact(results));
  }
  if (fixSuggestions && format !== "human" && totalFindings > 0) {
    console.log("\n--- Fix suggestions ---");
    for (const r of results) {
      for (const f of r.findings) {
        if (f.fix) console.log(`[${f.ruleId}] ${f.fix}`);
      }
    }
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
