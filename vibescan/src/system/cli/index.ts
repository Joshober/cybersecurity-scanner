#!/usr/bin/env node

// CLI: VibeScan / secure — scan [paths...] — project scan, optional registry check, generated tests.

import { execSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";
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
import type {
  ScannerOptions,
  Finding,
  ProjectScanResult,
} from "../types.js";
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
import { parseCliArgs } from "./parseArgs.js";

// ─── Helpers ────────────────────────────────────────────────────────

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
    tsAnalysis: scanOpts.tsAnalysis ?? "off",
    tsconfigPath: scanOpts.tsconfigPath,
    tsFailOpen: scanOpts.tsFailOpen,
  };
}

const HELP_TEXT = `
VibeScan (secure) — Static analysis for crypto failures and injection risks

Usage:
  secure scan [paths...] [options]
  vibescan scan [paths...] [options]

Options:
  --config <path>        vibescan.config.json (otherwise discovered upward from paths/cwd)
  --manifest <path>      Write benchmark run manifest JSON
  --export-adjudication <stem>  Write <stem>.json and <stem>.csv (one row per finding)
  --export-routes <path>     Write route inventory JSON (static scan only; merged Express routes)
  --export-third-party-surface <path>  Write third-party dependency surface JSON sidecar
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
  --ts-analysis off|auto|semantic  TypeScript semantic analysis mode
  --tsconfig <file>       Explicit tsconfig path for semantic TypeScript analysis
  --ts-fail-open          Fall back to syntax-only TS parsing when semantic setup fails
  --no-ts-fail-open       Treat semantic setup failures as fatal
  --baseline <file>       Ignore baseline entries for CI exit (see --write-baseline)
  --write-baseline <file> Write current findings to baseline JSON and exit 0
  --baseline-include-known With --baseline, print deferred findings too (verbose)
  --color always|never|auto

  vibescan report <results.json> [--html-out <path>]
    Build a static HTML report from a prior --format json output (no rescan).
`;

// ─── Parse CLI args ─────────────────────────────────────────────────

const parsed = parseCliArgs(process.argv.slice(2));
const rawArgs = process.argv.slice(2);

// ─── Early exits: help / report ─────────────────────────────────────

if (parsed.inputPaths.length === 0) {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (parsed.subcommand === "report") {
  try {
    const jsonPath = resolve(parsed.inputPaths[0]);
    const outPath = parsed.htmlOutPath ?? join(process.cwd(), "vibescan-report.html");
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

// ─── Config resolution ──────────────────────────────────────────────

const searchRoot = parsed.inputPaths.length > 0 ? resolve(parsed.inputPaths[0]) : process.cwd();
const configFilePath = parsed.configPathExplicit ?? findVibeScanConfigFile(searchRoot);
const fileCfg = configFilePath ? loadVibeScanConfigFile(configFilePath) : null;
const cm = parsed.cliMerge;

const merged = mergeVibeScanConfig(
  fileCfg,
  {
    format: cm.format,
    formatSet: cm.formatSet,
    excludeVendor: cm.excludeVendor,
    excludeVendorSet: cm.excludeVendorSet,
    severityThreshold: cm.severityThreshold,
    severitySet: cm.severitySet,
    crypto: cm.crypto,
    injection: cm.injection,
    rulesSet: cm.rulesSet,
    checkRegistry: cm.checkRegistry,
    checkRegistrySet: cm.checkRegistrySet,
    skipRegistry: cm.skipRegistry,
    skipRegistrySet: cm.skipRegistrySet,
    projectRoot: cm.projectRoot,
    ignoreGlobs: cm.ignoreGlobs,
    ignoreGlobsSet: cm.ignoreGlobsSet,
    openApiSpecPaths: cm.openApiSpecPathsSet ? cm.openApiSpecPaths : undefined,
    openApiSpecPathsSet: cm.openApiSpecPathsSet,
    openApiDiscovery: cm.openApiDiscovery,
    openApiDiscoverySet: cm.openApiDiscoverySet,
    buildId: cm.buildId,
    buildIdSet: cm.buildIdSet,
    tsAnalysis: cm.tsAnalysis,
    tsAnalysisSet: cm.tsAnalysisSet,
    tsconfigPath: cm.tsconfigPath,
    tsconfigPathSet: cm.tsconfigPathSet,
    tsFailOpen: cm.tsFailOpen,
    tsFailOpenSet: cm.tsFailOpenSet,
    baseline: parsed.baselineCliPath,
    baselineSet: parsed.baselineCliSet,
  },
  { crypto: true, injection: true }
);

const baselineFromConfig = merged.baseline ? resolve(searchRoot, merged.baseline) : undefined;
const effectiveBaselinePath = parsed.baselineCliSet ? parsed.baselineCliPath : baselineFromConfig;

let options: ScannerOptions = merged.scanner;
const format = merged.format;
const suppressions = merged.suppressions;

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

const files = collectScanFiles(parsed.inputPaths, options);

if (files.length === 0 && parsed.inputPaths.length > 0) {
  console.error("No files found for:", parsed.inputPaths.join(", "));
  process.exit(1);
}

const structuredStdout = format === "json" || format === "sarif";

function logScan(msg: string): void {
  if (structuredStdout) console.error(msg);
  else console.log(msg);
}

// ─── Pipeline steps ─────────────────────────────────────────────────

async function runScan(): Promise<{ project: ProjectScanResult; projectRoot: string; entries: { path: string; source: string }[] }> {
  logScan(`Scanning ${files.length} file${files.length === 1 ? "" : "s"}...`);
  const entries = files.map((p) => {
    const resolved = resolve(p);
    return { path: resolved, source: readFileSync(resolved, "utf-8") };
  });
  const inferredRoot = (() => {
    if (parsed.inputPaths.length === 0) return process.cwd();
    const firstPath = resolve(parsed.inputPaths[0]);
    try {
      return statSync(firstPath).isDirectory() ? firstPath : dirname(firstPath);
    } catch {
      return dirname(firstPath);
    }
  })();
  const projectRoot = options.projectRoot ?? inferredRoot;
  options = { ...options, projectRoot };
  const rawProject = await scanProjectAsync(entries, options, projectRoot);
  const findings = applySuppressions(rawProject.findings, suppressions);
  const project = { ...rawProject, findings };
  return { project, projectRoot, entries };
}

function emitWarnings(project: ProjectScanResult): void {
  for (const warning of project.warnings ?? []) {
    logScan(`Warning [${warning.code}]: ${warning.message}`);
  }
}

function handleWriteBaseline(project: ProjectScanResult, projectRoot: string): void {
  if (!(parsed.writeBaselineSet && parsed.writeBaselinePath)) return;
  const entriesOut = findingsToBaselineEntries(projectRoot, project.findings);
  const bf: BaselineFile = {
    version: BASELINE_FILE_VERSION,
    generatedAt: new Date().toISOString(),
    tool: "vibescan",
    note: "Findings after suppressions; CI with --baseline defers these until remediated.",
    entries: entriesOut,
  };
  writeFileSync(parsed.writeBaselinePath, JSON.stringify(bf, null, 2), "utf-8");
  console.error(`Wrote baseline (${entriesOut.length} entries): ${parsed.writeBaselinePath}`);
  process.exit(0);
}

function applyBaselinePartition(project: ProjectScanResult): {
  findingsForGate: Finding[];
  displayFindings: Finding[];
  baselineFindings: Finding[];
  freshFindings: Finding[];
  baselineData: BaselineFile | null;
} {
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
    : { baseline: [] as Finding[], fresh: project.findings };
  const findingsForGate = baselineData ? freshFindings : project.findings;
  const displayFindings = baselineData
    ? parsed.baselineIncludeKnown
      ? project.findings
      : freshFindings
    : project.findings;
  return { findingsForGate, displayFindings, baselineFindings, freshFindings, baselineData };
}

function findingsFail(fs: Finding[]): boolean {
  return fs.some((f) => f.severity === "critical" || f.severity === "error");
}

function writeSidecars(
  project: ProjectScanResult,
  projectRoot: string
): void {
  let adjJson: string | undefined;
  let adjCsv: string | undefined;
  if (parsed.adjudicationStem) {
    const w = writeAdjudicationExports(parsed.adjudicationStem, project.findings);
    adjJson = w.jsonPath;
    adjCsv = w.csvPath;
    if (structuredStdout) console.error(`Wrote adjudication: ${adjJson}, ${adjCsv}`);
  }
  if (parsed.manifestPath) {
    const man = buildRunManifest({
      argv: rawArgs,
      projectRoot,
      includedFiles: files,
      adjudicationJson: adjJson,
      adjudicationCsv: adjCsv,
      buildId: project.buildId ?? options.buildId,
      openApiSpecsUsed: project.openApiSpecsUsed,
    });
    writeRunManifest(parsed.manifestPath, man);
    if (structuredStdout) console.error(`Wrote manifest: ${parsed.manifestPath}`);
  }
}

function writeExports(
  project: ProjectScanResult,
  projectRoot: string,
  entries: { path: string; source: string }[],
  displayFindings: Finding[]
): void {
  if (options.mode === "ai") {
    const assistPath = parsed.aiAssistOutPath ?? join(projectRoot, "vibescan-ai-assist.md");
    const scannedRelativePaths = entries.map((e) =>
      relative(projectRoot, e.path).split("\\").join("/")
    );
    writeIdeAssistPrompt(assistPath, {
      projectRoot,
      findings: displayFindings,
      scannedRelativePaths,
    });
    logScan(`Wrote IDE assist prompt (Cursor / Claude Code): ${assistPath}`);
  }
  if (parsed.exportRoutesPath) {
    writeFileSync(
      parsed.exportRoutesPath,
      JSON.stringify({ routeInventory: project.routeInventory ?? [], routes: project.routes }, null, 2),
      "utf-8"
    );
    if (structuredStdout) console.error(`Wrote route export: ${parsed.exportRoutesPath}`);
  }
  if (parsed.exportThirdPartySurfacePath) {
    writeFileSync(
      parsed.exportThirdPartySurfacePath,
      JSON.stringify(project.thirdPartySurface ?? null, null, 2),
      "utf-8"
    );
    if (structuredStdout) console.error(`Wrote third-party surface export: ${parsed.exportThirdPartySurfacePath}`);
  }
}

function emitHtmlReport(projectOut: ProjectScanResult): void {
  if (!parsed.htmlReport) return;
  const htmlPath = parsed.htmlOutPath ?? join(process.cwd(), "vibescan-report.html");
  const html = projectScanToHtmlReport(projectOut, {
    generatedAt: new Date().toISOString(),
    toolVersion: readScannerPackageVersion(),
    buildId: projectOut.buildId ?? options.buildId,
  });
  writeFileSync(htmlPath, html, "utf-8");
  logScan(`Wrote HTML report: ${htmlPath}`);
}

function emitFixSuggestions(displayFindings: Finding[]): void {
  if (!parsed.fixSuggestions || displayFindings.length === 0) return;
  const stream = structuredStdout ? console.error : console.log;
  stream("\n--- Fix suggestions ---");
  for (const f of displayFindings) {
    const remed = f.remediation ?? f.fix;
    if (remed) stream(`[${f.ruleId}] ${remed}`);
  }
}

async function formatOutput(
  project: ProjectScanResult,
  projectRoot: string,
  displayFindings: Finding[],
  baselineFindings: Finding[],
  freshFindings: Finding[],
  baselineData: BaselineFile | null,
  exitCode: number
): Promise<number> {
  const projectOut = { ...project, findings: displayFindings };
  const totalFindings = displayFindings.length;
  const totalRaw = project.findings.length;

  if (format === "json") {
    const payload = JSON.parse(
      formatProjectJson(project, {
        benchmarkMetadata: parsed.benchmarkMetadata,
        includeRuleFamily: parsed.benchmarkMetadata,
        toolVersion: readScannerPackageVersion(),
        gitCommit: tryGitCommit(projectRoot),
        scanOptions: {
          ...scanOptionsEcho(options, format, parsed.benchmarkMetadata),
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
      return exitCode;
    }
    if (baselineData && freshFindings.length === 0 && baselineFindings.length > 0 && !parsed.baselineIncludeKnown) {
      console.log(
        `No new issues beyond baseline (${baselineFindings.length} known finding(s) deferred — use --baseline-include-known to list them).`
      );
      emitHtmlReport(projectOut);
      return exitCode;
    }
    if (totalFindings === 0 && (!baselineData || parsed.baselineIncludeKnown)) {
      console.log("No vulnerabilities found.");
      emitHtmlReport(projectOut);
      return exitCode;
    }
    const bl = baselineData
      ? ` (${freshFindings.length} affecting CI exit, ${baselineFindings.length} in baseline)`
      : "";
    console.log(`\n${totalFindings} finding${totalFindings === 1 ? "" : "s"} shown${bl}\n`);
    if (baselineData && !parsed.baselineIncludeKnown) {
      logScan(`(Baseline active: ${baselineFindings.length} deferred; exit reflects new issues only.)`);
    }
    const display = projectFindingsToScanResults(projectOut);
    if (format === "human") console.log(formatHuman(display, parsed.useColor));
    else console.log(formatCompact(display, parsed.useColor));
  }

  emitFixSuggestions(displayFindings);
  emitHtmlReport(projectOut);
  return exitCode;
}

// ─── Main orchestrator ──────────────────────────────────────────────

async function main(): Promise<void> {
  const { project, projectRoot, entries } = await runScan();
  emitWarnings(project);
  handleWriteBaseline(project, projectRoot);

  const { findingsForGate, displayFindings, baselineFindings, freshFindings, baselineData } =
    applyBaselinePartition(project);
  const exitCode = findingsFail(findingsForGate) ? 1 : 0;

  writeSidecars(project, projectRoot);
  writeExports(project, projectRoot, entries, displayFindings);

  const finalCode = await formatOutput(
    project,
    projectRoot,
    displayFindings,
    baselineFindings,
    freshFindings,
    baselineData,
    exitCode
  );

  process.exit(finalCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
