#!/usr/bin/env node

// CLI: VibeScan / secure — scan [paths...] — project scan, optional registry check, generated tests.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { scanProjectAsync } from "../scanner.js";
import {
  formatHuman,
  formatCompact,
  formatProjectJson,
  findingToJson,
  projectFindingsToScanResults,
  readScannerPackageVersion,
  sortFindingsStable,
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
import {
  findingsToBaselineEntries,
  parseBaselineFile,
  partitionByBaseline,
  BASELINE_FILE_VERSION,
  type BaselineFile,
} from "../baseline.js";
import { buildRunManifest, writeRunManifest } from "./manifest.js";
import { writeAdjudicationExports } from "./adjudication.js";
import { writeIdeAssistPrompt } from "./ideAssistPrompt.js";
import { projectJsonToHtmlReport, projectScanToHtmlReport } from "../htmlReport.js";

const args = process.argv.slice(2);
let subcommand = "";
let inputPaths: string[] = [];
let configPathExplicit: string | undefined;
let manifestPath: string | undefined;
let adjudicationStem: string | undefined;
let exportRoutesPath: string | undefined;
let aiAssistOutPath: string | undefined;

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
};

let fixSuggestions = false;
let useColor = process.stdout.isTTY;
let benchmarkMetadata = process.env.VIBESCAN_BENCHMARK === "1";
let htmlReport = false;
let htmlOutPath: string | undefined;
let baselineCliPath: string | undefined;
let writeBaselinePath: string | undefined;
let baselineIncludeKnown = false;
let baselineCliSet = false;
let writeBaselineSet = false;

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
  if (a === "report") {
    subcommand = "report";
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
  } else if (a === "--ai-assist-out" && args[i + 1]) {
    aiAssistOutPath = resolve(args[++i]);
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
  else if (a === "--check-registry") {
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
  } else if (a === "--baseline" && args[i + 1]) {
    baselineCliPath = resolve(args[++i]);
    baselineCliSet = true;
  } else if (a === "--write-baseline" && args[i + 1]) {
    writeBaselinePath = resolve(args[++i]);
    writeBaselineSet = true;
  } else if (a === "--baseline-include-known") {
    baselineIncludeKnown = true;
  } else if (a === "--color" && args[i + 1]) {
    const v = args[++i].toLowerCase();
    useColor = v === "always" ? true : v === "never" ? false : process.stdout.isTTY;
  } else if (a === "--html") {
    htmlReport = true;
  } else if (a === "--html-out" && args[i + 1]) {
    htmlOutPath = resolve(args[++i]);
  } else if (!a.startsWith("-")) {
    if (subcommand === "scan") inputPaths.push(a);
    else if (subcommand === "report") inputPaths.push(a);
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
  --mode static|ai           ai = same rules + write IDE paste-in prompt (no API keys)
  --ai-assist-out <path>     With --mode ai, markdown path (default: <project>/vibescan-ai-assist.md)
  --rules crypto,injection
  --no-crypto / --no-injection
  --severity critical|error|warning|info
  --format human|compact|json|sarif
  --html                 Write a static HTML report (default: ./vibescan-report.html)
  --html-out <path>      HTML report output path
  --exclude-vendor     Skip node_modules, dist, minified bundles, vendor trees
  --ignore-glob <pat>  Extra picomatch glob relative to project root (repeatable)
  --benchmark-metadata JSON: add run{} + findingsPerFile + ruleFamily; or set VIBESCAN_BENCHMARK=1
  --fix-suggestions
  --check-registry     HEAD npm registry for missing packages (slopsquat signal)
  --skip-registry      Skip registry checks
  --generate-tests [dir]  Local proof-oriented tests (same as vibescan prove); default dir ./vibescan-generated-tests
  --project-root <dir>    package.json resolution for registry check
  --openapi-spec <file>   OpenAPI/Swagger file (repeatable; disables discovery)
  --no-openapi-discovery  Do not auto-find openapi.* / swagger.* under project root
  --build-id <id>         Deployment/build label (JSON output + manifest)
  --baseline <file>       Ignore baseline entries for CI exit (see --write-baseline)
  --write-baseline <file> Write current findings to baseline JSON and exit 0
  --baseline-include-known With --baseline, print deferred findings too (verbose)
  --color always|never|auto

  vibescan report <results.json> [--html-out <path>]
    Build a static HTML report from a prior --format json output (no rescan).
`);
};

if (inputPaths.length === 0) {
  showHelp();
  process.exit(0);
}

if (subcommand === "report") {
  try {
    const jsonPath = resolve(inputPaths[0]);
    const outPath = htmlOutPath ?? join(process.cwd(), "vibescan-report.html");
    const text = readFileSync(jsonPath, "utf-8");
    const html = projectJsonToHtmlReport(text, {
      generatedAt: new Date().toISOString(),
      toolVersion: readScannerPackageVersion(),
    });
    writeFileSync(outPath, html, "utf-8");
    console.error(`Wrote HTML report: ${outPath}`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
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
    baseline: baselineCliPath,
    baselineSet: baselineCliSet,
  },
  { crypto: true, injection: true }
);

const baselineFromConfig = merged.baseline ? resolve(searchRoot, merged.baseline) : undefined;
const effectiveBaselinePath = baselineCliSet ? baselineCliPath : baselineFromConfig;

let options: ScannerOptions = merged.scanner;
const format = merged.format;
const suppressions = merged.suppressions;

const cm = cliMerge as unknown as {
  mode?: ScanMode;
  generateTests?: boolean;
  generateTestsDir?: string;
};
if (cm.mode) options = { ...options, mode: cm.mode };
if (cm.generateTests) {
  options = {
    ...options,
    generateTests: true,
    generateTestsOutputDir: cm.generateTestsDir ?? join(process.cwd(), "vibescan-generated-tests"),
  };
  console.error(
    "Note: `--generate-tests` runs the same local proof-oriented test generation as `vibescan prove` (preferred in documentation)."
  );
}

const files = collectScanFiles(inputPaths, options);

if (files.length === 0 && inputPaths.length > 0) {
  console.error("No files found for:", inputPaths.join(", "));
  process.exit(1);
}

function findingsFail(fs: Finding[]): boolean {
  return fs.some((f) => f.severity === "critical" || f.severity === "error");
}

const useIdeAssist = options.mode === "ai";
const structuredStdout = format === "json" || format === "sarif";

function logScan(msg: string): void {
  if (structuredStdout) console.error(msg);
  else console.log(msg);
}

function withFilteredFindings(project: ProjectScanResult): ProjectScanResult {
  const findings = applySuppressions(project.findings, suppressions);
  return { ...project, findings };
}

function emitHtmlReport(projectOut: ProjectScanResult): void {
  if (!htmlReport) return;
  const htmlPath = htmlOutPath ?? join(process.cwd(), "vibescan-report.html");
  const html = projectScanToHtmlReport(projectOut, {
    generatedAt: new Date().toISOString(),
    toolVersion: readScannerPackageVersion(),
    buildId: projectOut.buildId ?? options.buildId,
  });
  writeFileSync(htmlPath, html, "utf-8");
  const msg = `Wrote HTML report: ${htmlPath}`;
  if (structuredStdout) console.error(msg);
  else console.log(msg);
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

  if (writeBaselineSet && writeBaselinePath) {
    const entriesOut = findingsToBaselineEntries(projectRoot, project.findings);
    const bf: BaselineFile = {
      version: BASELINE_FILE_VERSION,
      generatedAt: new Date().toISOString(),
      tool: "vibescan",
      note: "Findings after suppressions; CI with --baseline defers these until remediated.",
      entries: entriesOut,
    };
    writeFileSync(writeBaselinePath, JSON.stringify(bf, null, 2), "utf-8");
    console.error(`Wrote baseline (${entriesOut.length} entries): ${writeBaselinePath}`);
    process.exit(0);
  }

  let baselineData: BaselineFile | null = null;
  if (effectiveBaselinePath) {
    try {
      baselineData = parseBaselineFile(readFileSync(effectiveBaselinePath, "utf-8"));
    } catch (e) {
      console.error(`Failed to read baseline file: ${effectiveBaselinePath}`);
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
  }

  const { baseline: baselineFindings, fresh: freshFindings } = baselineData
    ? partitionByBaseline(project.findings, baselineData.entries)
    : { baseline: [], fresh: project.findings };

  const findingsForGate = baselineData ? freshFindings : project.findings;
  const displayFindings = baselineData
    ? baselineIncludeKnown
      ? project.findings
      : freshFindings
    : project.findings;

  if (findingsFail(findingsForGate)) exitCode = 1;

  const totalFindings = displayFindings.length;
  const totalRaw = project.findings.length;

  maybeWriteSidecars(project.findings, projectRoot, {
    buildId: project.buildId ?? options.buildId,
    openApiSpecsUsed: project.openApiSpecsUsed,
  });

  if (useIdeAssist) {
    const assistPath = aiAssistOutPath ?? join(projectRoot, "vibescan-ai-assist.md");
    const scannedRelativePaths = entries.map((e) =>
      relative(projectRoot, e.path).split("\\").join("/")
    );
    writeIdeAssistPrompt(assistPath, {
      projectRoot,
      findings: displayFindings,
      scannedRelativePaths,
    });
    const msg = `Wrote IDE assist prompt (Cursor / Claude Code): ${assistPath}`;
    if (structuredStdout) console.error(msg);
    else console.log(msg);
  }

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

  const projectOut = { ...project, findings: displayFindings };

  if (format === "json") {
    const payload = JSON.parse(
      formatProjectJson(project, {
        benchmarkMetadata,
        includeRuleFamily: benchmarkMetadata,
        toolVersion: readScannerPackageVersion(),
        gitCommit: tryGitCommit(projectRoot),
        scanOptions: {
          ...scanOptionsEcho(options, format, benchmarkMetadata),
          ...(baselineData && effectiveBaselinePath
            ? {
                baseline: effectiveBaselinePath,
                baselineDeferred: baselineFindings.length,
                baselineFresh: freshFindings.length,
              }
            : {}),
        },
      })
    ) as Record<string, unknown>;
    if (baselineData && effectiveBaselinePath) {
      payload.baseline = {
        file: effectiveBaselinePath,
        deferredCount: baselineFindings.length,
        freshCount: freshFindings.length,
      };
      payload.regressions = sortFindingsStable(freshFindings).map((f) =>
        findingToJson(f, undefined, true, true, true)
      );
    }
    console.log(JSON.stringify(payload, null, 2));
  } else if (format === "sarif") {
    const { formatProjectSarif } = await import("../sarif.js");
    console.log(formatProjectSarif(project));
  } else {
    if (totalRaw === 0) {
      console.log("No vulnerabilities found.");
      emitHtmlReport(projectOut);
      process.exit(0);
    }
    if (baselineData && freshFindings.length === 0 && baselineFindings.length > 0 && !baselineIncludeKnown) {
      console.log(
        `No new issues beyond baseline (${baselineFindings.length} known finding(s) deferred — use --baseline-include-known to list them).`
      );
      emitHtmlReport(projectOut);
      process.exit(exitCode);
    }
    if (totalFindings === 0 && (!baselineData || baselineIncludeKnown)) {
      console.log("No vulnerabilities found.");
      emitHtmlReport(projectOut);
      process.exit(exitCode);
    }
    const bl = baselineData
      ? ` (${freshFindings.length} affecting CI exit, ${baselineFindings.length} in baseline)`
      : "";
    console.log(`\n${totalFindings} finding${totalFindings === 1 ? "" : "s"} shown${bl}\n`);
    if (baselineData && !baselineIncludeKnown) {
      const msg = `(Baseline active: ${baselineFindings.length} deferred; exit reflects new issues only.)`;
      if (structuredStdout) console.error(msg);
      else console.log(msg);
    }
    const display = projectFindingsToScanResults(projectOut);
    if (format === "human") console.log(formatHuman(display, useColor));
    else console.log(formatCompact(display, useColor));
  }

  if (fixSuggestions && format !== "human" && format !== "json" && format !== "sarif" && totalFindings > 0) {
    console.log("\n--- Fix suggestions ---");
    for (const f of displayFindings) {
      const remed = f.remediation ?? f.fix;
      if (remed) console.log(`[${f.ruleId}] ${remed}`);
    }
  }
  if ((format === "json" || format === "sarif") && fixSuggestions && totalFindings > 0) {
    console.error("\n--- Fix suggestions ---");
    for (const f of displayFindings) {
      const remed = f.remediation ?? f.fix;
      if (remed) console.error(`[${f.ruleId}] ${remed}`);
    }
  }

  emitHtmlReport(projectOut);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
