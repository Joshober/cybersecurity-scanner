// Main scan pipeline: parse, pattern rules, taint, route graph, audits, optional registry/tests.

import type { Program } from "estree";
import type {
  Finding,
  Severity,
  ScannerOptions,
  ScanResult,
  ProjectScanResult,
  ScanWarning,
  RouteNode,
} from "./types.js";
import type { Rule } from "./utils/rule-types.js";
import { parseFile, type ParseResult } from "./parser/parseFile.js";
import { extractRouteGraph } from "./parser/routeGraph.js";
import { extractNextAppRouteHandlers } from "./parser/nextRouteGraph.js";
import { createTsProjectContext, type TsProjectContext } from "./parser/tsProject.js";
import {
  runRuleEngine,
  runTaintEngine,
  runMiddlewareAudit,
  runWebhookAudit,
  runAppLevelAudit,
  generateTests,
  SEVERITY_ORDER,
  runOpenApiDriftAudit,
  resolveOpenApiSpecPaths,
  buildRouteInventory,
  runRoutePostureFinding,
} from "./engine/index.js";
import { analyzeThirdPartySurface } from "./depsurface/analyzer.js";
import { cryptoRules, injectionRules } from "../attacks/index.js";
import { checkDependencies, findPackageJsonNear } from "./ai/slopsquat.js";

// ─── Helpers ────────────────────────────────────────────────────────

function getRules(options: ScannerOptions): Rule[] {
  const rules: Rule[] = [];
  if (options.crypto !== false) rules.push(...cryptoRules);
  if (options.injection !== false) rules.push(...injectionRules);
  return rules;
}

function filterByThreshold(findings: Finding[], threshold?: Severity): Finding[] {
  if (!threshold) return findings;
  const min = SEVERITY_ORDER[threshold];
  return findings.filter((f) => SEVERITY_ORDER[f.severity] >= min);
}

function collectAndFilterFindings(
  target: Finding[],
  newFindings: Finding[],
  threshold?: Severity
): void {
  target.push(...filterByThreshold(newFindings, threshold));
}

function shiftFindings(findings: Finding[], lineDelta: number, fullSource: string): Finding[] {
  const lines = fullSource.split("\n");
  return findings.map((f) => {
    const line = f.line + lineDelta;
    return {
      ...f,
      line,
      endLine: f.endLine !== undefined ? f.endLine + lineDelta : undefined,
      source: lines[line - 1] ?? f.source,
    };
  });
}

function extractRoutesFromParsed(
  ast: Program,
  source: string,
  filePath: string,
  projectRoot?: string
): RouteNode[] {
  return [
    ...extractRouteGraph(ast, source, filePath),
    ...extractNextAppRouteHandlers(ast, source, filePath, projectRoot),
  ];
}

// ─── Analysis Unit ──────────────────────────────────────────────────
// Normalizes the parse → analyze boundary.
// A normal file produces one unit with fullAst=true.
// An EJS file produces N units (one per <script> block) with fullAst=false.

interface AnalysisUnit {
  ast: Program;
  source: string;
  parseResult: ParseResult;
  fullAst: boolean;
  lineDelta: number;
}

function buildAnalysisUnits(parseResult: ParseResult): AnalysisUnit[] {
  if (parseResult.ejsBlocks) {
    return parseResult.ejsBlocks.map((block) => ({
      ast: block.parseResult.ast,
      source: block.parseResult.source,
      parseResult: block.parseResult,
      fullAst: false,
      lineDelta: block.lineDelta,
    }));
  }
  return [
    {
      ast: parseResult.ast,
      source: parseResult.source,
      parseResult,
      fullAst: true,
      lineDelta: 0,
    },
  ];
}

// ─── Per-file analysis ──────────────────────────────────────────────
// Accepts a pre-parsed result so the caller can cache/reuse parses.

function analyzeFile(
  parseResult: ParseResult,
  filePath: string,
  options: ScannerOptions
): { findings: Finding[]; routes: RouteNode[] } {
  const rules = getRules(options);
  const units = buildAnalysisUnits(parseResult);
  const findings: Finding[] = [];
  const routes: RouteNode[] = [];

  for (const unit of units) {
    // Pattern rules run on every unit (EJS blocks and normal files alike).
    const patternFindings = runRuleEngine({
      filePath,
      source: unit.source,
      ast: unit.ast,
      rules,
      options,
      parseResult: unit.parseResult,
    });
    if (unit.lineDelta > 0) {
      findings.push(...shiftFindings(patternFindings, unit.lineDelta, parseResult.source));
    } else {
      findings.push(...patternFindings);
    }

    // Taint, route extraction, and app-level audit only run on full ASTs.
    if (!unit.fullAst) continue;

    if (options.injection !== false) {
      findings.push(
        ...runTaintEngine({
          filePath,
          source: unit.source,
          ast: unit.ast,
          options,
          parseResult: unit.parseResult,
        })
      );
    }

    const fileRoutes = extractRoutesFromParsed(unit.ast, unit.source, filePath, options.projectRoot);
    routes.push(...fileRoutes);

    findings.push(
      ...runAppLevelAudit(unit.ast, unit.source, {
        hasRoutes: fileRoutes.length > 0,
        filePath,
      })
    );
  }

  return {
    findings: filterByThreshold(findings, options.severityThreshold),
    routes,
  };
}

// ─── Public API ─────────────────────────────────────────────────────

export function scan(
  source: string,
  filePath: string,
  options: ScannerOptions = {},
  scanContext?: { tsProject?: TsProjectContext | null }
): ScanResult {
  const parseResult = parseFile(source, filePath, { tsProject: scanContext?.tsProject });

  if (!parseResult) {
    return { filePath, findings: [], source, warnings: [] };
  }

  const { findings, routes } = analyzeFile(parseResult, filePath, options);
  return { filePath, findings, source: parseResult.source, routes, warnings: [] };
}

export function scanProject(
  files: { path: string; source: string }[],
  options: ScannerOptions = {}
): ProjectScanResult {
  const packageJsonPath = findPackageJsonNear(options.projectRoot ?? process.cwd());
  const tsProject = createTsProjectContext(files, options);
  const warnings: ScanWarning[] = [...(tsProject?.warnings ?? [])];
  const threshold = options.severityThreshold;

  // Parse every file once; reuse for both route pre-scan and per-file analysis.
  const parsed = new Map<string, ParseResult | null>();
  for (const f of files) {
    parsed.set(f.path, parseFile(f.source, f.path, { tsProject }));
  }

  // Pre-scan: extract routes from all parseable non-EJS files.
  const allRoutes: RouteNode[] = [];
  for (const f of files) {
    const pr = parsed.get(f.path);
    if (!pr || pr.ejsBlocks) continue;
    allRoutes.push(...extractRoutesFromParsed(pr.ast, pr.source, f.path, options.projectRoot));
  }

  // Per-file analysis using cached parse results.
  const fileResults: ScanResult[] = [];
  const allFindings: Finding[] = [];
  for (const f of files) {
    const pr = parsed.get(f.path);
    if (!pr) {
      fileResults.push({ filePath: f.path, findings: [], source: f.source, warnings: [] });
      continue;
    }
    const { findings, routes } = analyzeFile(pr, f.path, options);
    fileResults.push({ filePath: f.path, findings, source: pr.source, routes, warnings: [] });
    allFindings.push(...findings);
  }

  // Cross-file audits.
  collectAndFilterFindings(allFindings, runMiddlewareAudit(allRoutes), threshold);

  const specPaths = resolveOpenApiSpecPaths(
    options.projectRoot,
    options.openApiSpecPaths,
    options.openApiDiscovery
  );
  if (specPaths.length > 0) {
    collectAndFilterFindings(allFindings, runOpenApiDriftAudit(allRoutes, specPaths), threshold);
  }

  collectAndFilterFindings(allFindings, runRoutePostureFinding(allRoutes), threshold);
  collectAndFilterFindings(allFindings, runWebhookAudit(allRoutes), threshold);

  const routeInventory = buildRouteInventory(allRoutes);
  const thirdPartySurface = analyzeThirdPartySurface(
    files,
    { findings: allFindings, routes: allRoutes, routeInventory },
    options.projectRoot
  );

  return {
    fileResults,
    routes: allRoutes,
    findings: allFindings,
    packageJsonPath,
    openApiSpecsUsed: specPaths.length > 0 ? specPaths : undefined,
    routeInventory,
    thirdPartySurface,
    buildId: options.buildId,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function scanProjectAsync(
  files: { path: string; source: string }[],
  options: ScannerOptions = {},
  projectRoot?: string
): Promise<ProjectScanResult> {
  const root = projectRoot ?? options.projectRoot ?? process.cwd();
  const opts: ScannerOptions = { ...options, projectRoot: options.projectRoot ?? root };
  const base = scanProject(files, opts);
  const packageJsonPath = base.packageJsonPath ?? findPackageJsonNear(opts.projectRoot ?? root);

  const registryFindings: Finding[] =
    opts.checkRegistry && !opts.skipRegistry && packageJsonPath
      ? filterByThreshold(await checkDependencies(packageJsonPath, { skipRegistry: opts.skipRegistry }), opts.severityThreshold)
      : [];

  if (opts.generateTests && opts.generateTestsOutputDir) {
    const allFindings = [...base.findings, ...registryFindings];
    const written = generateTests(allFindings, opts.generateTestsOutputDir, { projectRoot: root });
    if (written.length > 0) {
      console.error(
        `VibeScan: wrote ${written.length} local proof-oriented test file(s) under ${opts.generateTestsOutputDir}`
      );
    }
  }

  return {
    ...base,
    findings: [...base.findings, ...registryFindings],
    packageJsonPath,
    thirdPartySurface: base.thirdPartySurface
      ? {
          ...base.thirdPartySurface,
          packageJsonPath: base.thirdPartySurface.packageJsonPath ?? packageJsonPath,
        }
      : base.thirdPartySurface,
  };
}

export async function scanAsync(
  source: string,
  filePath: string,
  options: ScannerOptions = {},
  scanContext?: { tsProject?: TsProjectContext | null }
): Promise<ScanResult> {
  return Promise.resolve(scan(source, filePath, options, scanContext));
}

export { cryptoRules, injectionRules } from "../attacks/index.js";
