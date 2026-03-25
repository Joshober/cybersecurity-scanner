#!/usr/bin/env node

// CLI: VibeScan / secure — scan [paths...] — project scan, optional registry check, generated tests.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { scanAsync, scanProjectAsync } from "../scanner.js";
import {
  formatHuman,
  formatCompact,
  formatJson,
  formatProjectJson,
  projectFindingsToScanResults,
  readScannerPackageVersion,
} from "../format.js";
import type { ScannerOptions, Severity, ScanMode, Finding, ProjectScanResult } from "../types.js";
import { collectScanFiles } from "./collectFiles.js";
import {
  findVibeScanConfigFile,
  loadVibeScanConfigFile,
  mergeVibeScanConfig,
  type OutputFormat,
} from "./vibescanConfig.js";
import { applySuppressions } from "../suppress.js";
import { buildRunManifest, writeRunManifest } from "./manifest.js";
import { writeAdjudicationExports } from "./adjudication.js";
import { buildFixAssistantPrompt } from "../fixPrompt.js";

const args = process.argv.slice(2);
let subcommand = "";
let inputPaths: string[] = [];
let configPathExplicit: string | undefined;
let manifestPath: string | undefined;
let adjudicationStem: string | undefined;
let exportRoutesPath: string | undefined;

const cliMerge = {
  format: undefined as OutputFormat | undefined,
  formatSet: false,
  excludeVendor: false,
  excludeVendorSet: false,
  severityThreshold: undefined as Severity | undefined,
  severitySet: false,
  crypto: true,
  injection: true,
  rulesSet: false,
  checkRegistry: false,
  checkRegistrySet: false,
  skipRegistry: false,
  skipRegistrySet: false,
  projectRoot: undefined as string | undefined,
  ignoreGlobs: undefined as string[] | undefined,
  ignoreGlobsSet: false,
  openApiSpecPaths: [] as string[],
  openApiSpecPathsSet: false,
  openApiDiscovery: true,
  openApiDiscoverySet: false,
  buildId: undefined as string | undefined,
  buildIdSet: false,
  npmAudit: false,
  npmAuditSet: false,
  httpProbeUrl: undefined as string | undefined,
  httpProbeUrlSet: false,
  httpProbeMaxRoutes: undefined as number | undefined,
  httpProbeMaxRoutesSet: false,
};

let fixSuggestions = false;
let fixPromptFile: string | undefined;
let useColor = process.stdout.isTTY;
let benchmarkMetadata = process.env.VIBESCAN_BENCHMARK === "1";

function tryGitCommit(cwd: string): string | null {
  try {
    const h = execSync("git rev-parse HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return h || null;
  } catch {
    return null;
  }
}

function scanOptionsEcho(
  scanOpts: ScannerOptions,
  outFormat: OutputFormat,
  benchMeta: boolean
): Record<string, unknown> {
  return {
    format: outFormat,
    mode: scanOpts.mode ?? "static",
    excludeVendor: !!scanOpts.excludeVendor,
    checkRegistry: !!scanOpts.checkRegistry,
    skipRegistry: !!scanOpts.skipRegistry,
    npmAudit: !!scanOpts.npmAudit,
    httpProbeUrl: scanOpts.httpProbeUrl,
    httpProbeMaxRoutes: scanOpts.httpProbeMaxRoutes,
    crypto: scanOpts.crypto,
    injection: scanOpts.injection,
    severityThreshold: scanOpts.severityThreshold,
    ignoreGlobs: scanOpts.ignoreGlobs ?? [],
    benchmarkMetadata: benchMeta,
    buildId: scanOpts.buildId,
  };
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "scan") {
    subcommand = "scan";
    continue;
  }
  if (a === "--config" && args[i + 1]) {
    configPathExplicit = resolve(args[++i]);
  } else if (a === "--manifest" && args[i + 1]) {
    manifestPath = resolve(args[++i]);
  } else if (a === "--export-routes" && args[i + 1]) {
    exportRoutesPath = resolve(args[++i]);
  } else if (a === "--export-adjudication" && args[i + 1]) {
    adjudicationStem = args[++i];
  } else if (a === "--mode" && args[i + 1]) {
    const m = args[++i].toLowerCase();
    if (m === "static" || m === "ai") {
      // applied after merge
      (cliMerge as unknown as { mode?: ScanMode }).mode = m as ScanMode;
    }
  } else if (a === "--ai-api-url" && args[i + 1]) {
    (cliMerge as unknown as { aiUrl?: string }).aiUrl = args[++i];
  } else if (a === "--ai-api-key" && args[i + 1]) {
    (cliMerge as unknown as { aiKey?: string }).aiKey = args[++i];
  } else if (a === "--ai-model" && args[i + 1]) {
    (cliMerge as unknown as { aiModel?: string }).aiModel = args[++i];
  } else if (a === "--no-crypto") {
    cliMerge.crypto = false;
    cliMerge.rulesSet = true;
  } else if (a === "--no-injection") {
    cliMerge.injection = false;
    cliMerge.rulesSet = true;
  } else if (a === "--rules" && args[i + 1]) {
    const val = args[++i].toLowerCase();
    cliMerge.crypto = val.includes("crypto");
    cliMerge.injection = val.includes("injection");
    cliMerge.rulesSet = true;
  } else if (a === "--severity" && args[i + 1]) {
    const s = args[++i].toLowerCase();
    if (["critical", "error", "warning", "info"].includes(s)) {
      cliMerge.severityThreshold = s as Severity;
      cliMerge.severitySet = true;
    }
  } else if (a === "--format" && args[i + 1]) {
    const f = args[++i].toLowerCase();
    if (f === "json") cliMerge.format = "json";
    else if (f === "sarif") cliMerge.format = "sarif";
    else if (f === "human") cliMerge.format = "human";
    else cliMerge.format = "compact";
    cliMerge.formatSet = true;
  } else if (a === "--fix-suggestions") fixSuggestions = true;
  else if (a === "--npm-audit") {
    cliMerge.npmAudit = true;
    cliMerge.npmAuditSet = true;
  } else if (a === "--http-probe-url" && args[i + 1]) {
    cliMerge.httpProbeUrl = args[++i];
    cliMerge.httpProbeUrlSet = true;
  } else if (a === "--http-probe-max-routes" && args[i + 1]) {
    const n = parseInt(args[++i], 10);
    if (!Number.isNaN(n) && n > 0) {
      cliMerge.httpProbeMaxRoutes = n;
      cliMerge.httpProbeMaxRoutesSet = true;
    }
  } else if (a === "--fix-prompt-file" && args[i + 1]) {
    fixPromptFile = resolve(args[++i]);
  } else if (a === "--check-registry") {
    cliMerge.checkRegistry = true;
    cliMerge.checkRegistrySet = true;
  } else if (a === "--skip-registry") {
    cliMerge.skipRegistry = true;
    cliMerge.skipRegistrySet = true;
  } else if (a === "--exclude-vendor") {
    cliMerge.excludeVendor = true;
    cliMerge.excludeVendorSet = true;
  } else if (a === "--ignore-glob" && args[i + 1]) {
    cliMerge.ignoreGlobs = cliMerge.ignoreGlobs ?? [];
    cliMerge.ignoreGlobs.push(args[++i]);
    cliMerge.ignoreGlobsSet = true;
  } else if (a === "--benchmark-metadata") {
    benchmarkMetadata = true;
  } else if (a === "--generate-tests") {
    (cliMerge as unknown as { generateTests?: boolean }).generateTests = true;
    if (args[i + 1] && !args[i + 1].startsWith("-")) {
      (cliMerge as unknown as { generateTestsDir?: string }).generateTestsDir = resolve(args[++i]);
    } else {
      (cliMerge as unknown as { generateTestsDir?: string }).generateTestsDir = join(
        process.cwd(),
        "vibescan-generated-tests"
      );
    }
  } else if (a === "--project-root" && args[i + 1]) {
    cliMerge.projectRoot = resolve(args[++i]);
  } else if (a === "--openapi-spec" && args[i + 1]) {
    cliMerge.openApiSpecPaths.push(resolve(args[++i]));
    cliMerge.openApiSpecPathsSet = true;
  } else if (a === "--no-openapi-discovery") {
    cliMerge.openApiDiscovery = false;
    cliMerge.openApiDiscoverySet = true;
  } else if (a === "--build-id" && args[i + 1]) {
    cliMerge.buildId = args[++i];
    cliMerge.buildIdSet = true;
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
VibeScan (secure) — Static analysis for crypto failures and injection risks

Usage:
  secure scan [paths...] [options]
  vibescan scan [paths...] [options]

Options:
  --config <path>        vibescan.config.json (otherwise discovered upward from paths/cwd)
  --manifest <path>      Write benchmark run manifest JSON
  --export-adjudication <stem>  Write <stem>.json and <stem>.csv (one row per finding)
  --export-routes <path>     Write route inventory JSON (static scan only; merged Express routes)
  --mode static|ai
  --rules crypto,injection
  --no-crypto / --no-injection
  --severity critical|error|warning|info
  --format human|compact|json|sarif
  --exclude-vendor     Skip node_modules, dist, minified bundles, vendor trees
  --ignore-glob <pat>  Extra picomatch glob relative to project root (repeatable)
  --benchmark-metadata JSON: add run{} + findingsPerFile + ruleFamily; or set VIBESCAN_BENCHMARK=1
  --fix-suggestions
  --check-registry     HEAD npm registry for missing packages (slopsquat signal)
  --npm-audit          Merge npm audit --json findings (CVE / dependency advisories)
  --http-probe-url <u> Shallow GET probes for discovered Express routes (app must be running)
  --http-probe-max-routes <n>  Cap probes (default 12)
  --fix-prompt-file <path>  Write LLM-oriented remediation prompt from findings
  --skip-registry      Skip registry checks
  --generate-tests [dir]  Emit stub tests under dir (default: ./vibescan-generated-tests)
  --project-root <dir>    package.json resolution for registry check
  --openapi-spec <file>   OpenAPI/Swagger file (repeatable; disables discovery)
  --no-openapi-discovery  Do not auto-find openapi.* / swagger.* under project root
  --build-id <id>         Deployment/build label (JSON output + manifest)
  --color always|never|auto
  --ai-api-url, --ai-api-key, --ai-model
`);
};

if (inputPaths.length === 0) {
  showHelp();
  process.exit(0);
}

const searchRoot = inputPaths.length > 0 ? resolve(inputPaths[0]) : process.cwd();
const configFilePath = configPathExplicit ?? findVibeScanConfigFile(searchRoot);
const fileCfg = configFilePath ? loadVibeScanConfigFile(configFilePath) : null;

const merged = mergeVibeScanConfig(
  fileCfg,
  {
    format: cliMerge.format,
    formatSet: cliMerge.formatSet,
    excludeVendor: cliMerge.excludeVendor,
    excludeVendorSet: cliMerge.excludeVendorSet,
    severityThreshold: cliMerge.severityThreshold,
    severitySet: cliMerge.severitySet,
    crypto: cliMerge.crypto,
    injection: cliMerge.injection,
    rulesSet: cliMerge.rulesSet,
    checkRegistry: cliMerge.checkRegistry,
    checkRegistrySet: cliMerge.checkRegistrySet,
    skipRegistry: cliMerge.skipRegistry,
    skipRegistrySet: cliMerge.skipRegistrySet,
    projectRoot: cliMerge.projectRoot,
    ignoreGlobs: cliMerge.ignoreGlobs,
    ignoreGlobsSet: cliMerge.ignoreGlobsSet,
    openApiSpecPaths: cliMerge.openApiSpecPathsSet ? cliMerge.openApiSpecPaths : undefined,
    openApiSpecPathsSet: cliMerge.openApiSpecPathsSet,
    openApiDiscovery: cliMerge.openApiDiscovery,
    openApiDiscoverySet: cliMerge.openApiDiscoverySet,
    buildId: cliMerge.buildId,
    buildIdSet: cliMerge.buildIdSet,
    npmAudit: cliMerge.npmAudit,
    npmAuditSet: cliMerge.npmAuditSet,
    httpProbeUrl: cliMerge.httpProbeUrl,
    httpProbeUrlSet: cliMerge.httpProbeUrlSet,
    httpProbeMaxRoutes: cliMerge.httpProbeMaxRoutes,
    httpProbeMaxRoutesSet: cliMerge.httpProbeMaxRoutesSet,
  },
  { crypto: true, injection: true }
);

let options: ScannerOptions = merged.scanner;
const format = merged.format;
const suppressions = merged.suppressions;

const cm = cliMerge as unknown as {
  mode?: ScanMode;
  aiUrl?: string;
  aiKey?: string;
  aiModel?: string;
  generateTests?: boolean;
  generateTestsDir?: string;
};
if (cm.mode) options = { ...options, mode: cm.mode };
if (cm.aiUrl || cm.aiKey || cm.aiModel) {
  options = {
    ...options,
    ai: { apiUrl: cm.aiUrl, apiKey: cm.aiKey, model: cm.aiModel },
  };
}
if (cm.generateTests) {
  options = {
    ...options,
    generateTests: true,
    generateTestsOutputDir: cm.generateTestsDir ?? join(process.cwd(), "vibescan-generated-tests"),
  };
}

const files = collectScanFiles(inputPaths, options);

if (files.length === 0 && inputPaths.length > 0) {
  console.error("No files found for:", inputPaths.join(", "));
  process.exit(1);
}

function findingsFail(fs: Finding[]): boolean {
  return fs.some((f) => f.severity === "critical" || f.severity === "error");
}

const useAi = options.mode === "ai";
const structuredStdout = format === "json" || format === "sarif";

function logScan(msg: string): void {
  if (structuredStdout) console.error(msg);
  else console.log(msg);
}

function withFilteredFindings(project: ProjectScanResult): ProjectScanResult {
  const findings = applySuppressions(project.findings, suppressions);
  return { ...project, findings };
}

function maybeWriteSidecars(
  findings: Finding[],
  projectRoot: string,
  extras?: { buildId?: string; openApiSpecsUsed?: string[] }
): void {
  let adjJson: string | undefined;
  let adjCsv: string | undefined;
  if (adjudicationStem) {
    const w = writeAdjudicationExports(adjudicationStem, findings);
    adjJson = w.jsonPath;
    adjCsv = w.csvPath;
    if (structuredStdout) console.error(`Wrote adjudication: ${adjJson}, ${adjCsv}`);
  }
  if (manifestPath) {
    const man = buildRunManifest({
      argv: args,
      projectRoot,
      includedFiles: files,
      adjudicationJson: adjJson,
      adjudicationCsv: adjCsv,
      buildId: extras?.buildId,
      openApiSpecsUsed: extras?.openApiSpecsUsed,
    });
    writeRunManifest(manifestPath, man);
    if (structuredStdout) console.error(`Wrote manifest: ${manifestPath}`);
  }
}

async function main(): Promise<void> {
  let exitCode = 0;

  if (useAi) {
    logScan(`Scanning ${files.length} file${files.length === 1 ? "" : "s"} (AI mode)...`);
    const results: import("../types.js").ScanResult[] = [];
    for (const file of files) {
      const path = resolve(file);
      if (!existsSync(path)) continue;
      const source = readFileSync(path, "utf-8");
      const result = await scanAsync(source, path, options);
      results.push(result);
    }
    let flat: Finding[] = [];
    for (const r of results) {
      for (const f of r.findings) flat.push({ ...f, filePath: f.filePath ?? r.filePath });
    }
    flat = applySuppressions(flat, suppressions);
    if (findingsFail(flat)) exitCode = 1;
    for (const r of results) {
      const kept = flat.filter((f) => (f.filePath ?? r.filePath) === r.filePath);
      r.findings = kept;
    }

    const projectRoot =
      options.projectRoot ?? (inputPaths.length > 0 ? resolve(inputPaths[0]) : process.cwd());
    maybeWriteSidecars(flat, projectRoot, { buildId: options.buildId });

    const totalFindings = flat.length;
    if (format === "json") {
      console.log(formatJson(results));
    } else if (format === "sarif") {
      const { formatProjectSarif, scanResultsToProjectForSarif } = await import("../sarif.js");
      console.log(formatProjectSarif(scanResultsToProjectForSarif(results)));
    } else {
      if (totalFindings === 0) {
        console.log("No vulnerabilities found.");
        if (fixPromptFile) {
          const text = buildFixAssistantPrompt({
            projectLabel: projectRoot,
            findings: flat,
          });
          writeFileSync(fixPromptFile, text, "utf-8");
          if (structuredStdout) console.error(`Wrote fix prompt: ${fixPromptFile}`);
          else console.log(`Wrote fix prompt: ${fixPromptFile}`);
        }
        process.exit(0);
      }
      console.log(`\n${totalFindings} vulnerabilit${totalFindings === 1 ? "y" : "ies"} found\n`);
      if (format === "human") console.log(formatHuman(results, useColor));
      else console.log(formatCompact(results, useColor));
    }
    if (fixSuggestions && format !== "human" && format !== "json" && format !== "sarif" && totalFindings > 0) {
      console.log("\n--- Fix suggestions ---");
      for (const r of results) {
        for (const f of r.findings) {
          const remed = f.remediation ?? f.fix;
          if (remed) console.log(`[${f.ruleId}] ${remed}`);
        }
      }
    }
    if ((format === "json" || format === "sarif") && fixSuggestions && totalFindings > 0) {
      console.error("\n--- Fix suggestions ---");
      for (const r of results) {
        for (const f of r.findings) {
          const remed = f.remediation ?? f.fix;
          if (remed) console.error(`[${f.ruleId}] ${remed}`);
        }
      }
    }
    if (fixPromptFile) {
      const text = buildFixAssistantPrompt({
        projectLabel: projectRoot,
        findings: flat,
      });
      writeFileSync(fixPromptFile, text, "utf-8");
      if (structuredStdout) console.error(`Wrote fix prompt: ${fixPromptFile}`);
      else console.log(`Wrote fix prompt: ${fixPromptFile}`);
    }
    process.exit(exitCode);
    return;
  }

  logScan(`Scanning ${files.length} file${files.length === 1 ? "" : "s"}...`);
  const entries = files.map((path) => ({
    path: resolve(path),
    source: readFileSync(resolve(path), "utf-8"),
  }));
  const projectRoot =
    options.projectRoot ??
    (inputPaths.length > 0 ? resolve(inputPaths[0]) : process.cwd());
  options = { ...options, projectRoot };
  const rawProject = await scanProjectAsync(entries, options, projectRoot);
  const project = withFilteredFindings(rawProject);

  if (findingsFail(project.findings)) exitCode = 1;

  const totalFindings = project.findings.length;
  maybeWriteSidecars(project.findings, projectRoot, {
    buildId: project.buildId ?? options.buildId,
    openApiSpecsUsed: project.openApiSpecsUsed,
  });

  if (exportRoutesPath) {
    writeFileSync(
      exportRoutesPath,
      JSON.stringify(
        {
          routeInventory: project.routeInventory ?? [],
          routes: project.routes,
        },
        null,
        2
      ),
      "utf-8"
    );
    if (structuredStdout) console.error(`Wrote route export: ${exportRoutesPath}`);
  }

  if (format === "json") {
    console.log(
      formatProjectJson(project, {
        benchmarkMetadata,
        includeRuleFamily: benchmarkMetadata,
        toolVersion: readScannerPackageVersion(),
        gitCommit: tryGitCommit(projectRoot),
        scanOptions: scanOptionsEcho(options, format, benchmarkMetadata),
      })
    );
  } else if (format === "sarif") {
    const { formatProjectSarif } = await import("../sarif.js");
    console.log(formatProjectSarif(project));
  } else {
    if (totalFindings === 0) {
      console.log("No vulnerabilities found.");
      if (fixPromptFile) {
        const text = buildFixAssistantPrompt({
          projectLabel: projectRoot,
          findings: project.findings,
        });
        writeFileSync(fixPromptFile, text, "utf-8");
        if (structuredStdout) console.error(`Wrote fix prompt: ${fixPromptFile}`);
        else console.log(`Wrote fix prompt: ${fixPromptFile}`);
      }
      process.exit(0);
    }
    console.log(`\n${totalFindings} vulnerabilit${totalFindings === 1 ? "y" : "ies"} found\n`);
    const display = projectFindingsToScanResults(project);
    if (format === "human") console.log(formatHuman(display, useColor));
    else console.log(formatCompact(display, useColor));
  }

  if (fixSuggestions && format !== "human" && format !== "json" && format !== "sarif" && totalFindings > 0) {
    console.log("\n--- Fix suggestions ---");
    for (const f of project.findings) {
      const remed = f.remediation ?? f.fix;
      if (remed) console.log(`[${f.ruleId}] ${remed}`);
    }
  }
  if ((format === "json" || format === "sarif") && fixSuggestions && totalFindings > 0) {
    console.error("\n--- Fix suggestions ---");
    for (const f of project.findings) {
      const remed = f.remediation ?? f.fix;
      if (remed) console.error(`[${f.ruleId}] ${remed}`);
    }
  }

  if (fixPromptFile) {
    const text = buildFixAssistantPrompt({
      projectLabel: projectRoot,
      findings: project.findings,
    });
    writeFileSync(fixPromptFile, text, "utf-8");
    if (structuredStdout) console.error(`Wrote fix prompt: ${fixPromptFile}`);
    else console.log(`Wrote fix prompt: ${fixPromptFile}`);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
