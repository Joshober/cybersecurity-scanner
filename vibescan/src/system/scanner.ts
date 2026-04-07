// Main scan pipeline: parse, pattern rules, taint, route graph, audits, optional registry/tests.

import type { Program } from "estree";
import type { Finding, ScannerOptions, ScanResult, ProjectScanResult, ScanWarning } from "./types.js";
import type { Rule } from "./utils/rule-types.js";
import { parseFile } from "./parser/parseFile.js";
import { extractEjsScriptBlocks } from "./parser/ejsScripts.js";
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
} from "./engine/index.js";
import { runOpenApiDriftAudit, resolveOpenApiSpecPaths } from "./engine/openapiDrift.js";
import { buildRouteInventory, runRoutePostureFinding } from "./engine/routeInventory.js";
import { analyzeThirdPartySurface } from "./depsurface/analyzer.js";
import { cryptoRules, injectionRules } from "../attacks/index.js";
import { checkDependencies, findPackageJsonNear } from "./ai/slopsquat.js";

function getRules(options: ScannerOptions): Rule[] {
  const rules: Rule[] = [];
  if (options.crypto !== false) rules.push(...cryptoRules);
  if (options.injection !== false) rules.push(...injectionRules);
  return rules;
}

function filterByThreshold(findings: Finding[], threshold?: import("./types.js").Severity): Finding[] {
  if (!threshold) return findings;
  const min = SEVERITY_ORDER[threshold];
  return findings.filter((f) => SEVERITY_ORDER[f.severity] >= min);
}

function shiftRuleFindings(findings: Finding[], lineDelta: number, fullSource: string): Finding[] {
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

// Scan one file: parse to AST, run pattern rules, taint, route extraction, app-level audit.
export function scan(
  source: string,
  filePath: string,
  options: ScannerOptions = {},
  scanContext?: { tsProject?: TsProjectContext | null }
): ScanResult {
  const warnings: ScanWarning[] = [];
  const parseResult = parseFile(source, filePath, { tsProject: scanContext?.tsProject });
  const lowerPath = filePath.replace(/\\/g, "/").toLowerCase();
  const isEjs = lowerPath.endsWith(".ejs");

  if (!parseResult && !isEjs) {
    return { filePath, findings: [], source, warnings };
  }

  const rules = getRules(options);
  let patternFindings: Finding[] = [];
  let ast: Program;
  let src: string;

  if (parseResult) {
    ast = parseResult.ast;
    src = parseResult.source;
    patternFindings = runRuleEngine({
      filePath,
      source: src,
      ast,
      rules,
      options,
      parseResult,
    });
  } else {
    src = source;
    ast = { type: "Program", body: [], sourceType: "script" } as Program;
    for (const block of extractEjsScriptBlocks(source)) {
      if (!block.content.trim()) continue;
      const pr = parseFile(block.content, filePath, { tsProject: scanContext?.tsProject });
      if (!pr) continue;
      const chunk = runRuleEngine({
        filePath,
        source: pr.source,
        ast: pr.ast,
        rules,
        options,
        parseResult: pr,
      });
      patternFindings.push(...shiftRuleFindings(chunk, block.baseLine - 1, source));
    }
  }

  const taintFindings: Finding[] =
    options.injection !== false && parseResult
      ? runTaintEngine({
          filePath,
          source: src,
          ast,
          options,
          parseResult,
        })
      : [];

  const expressRoutes = parseResult ? extractRouteGraph(ast, src, filePath) : [];
  const nextRoutes = parseResult
    ? extractNextAppRouteHandlers(ast, src, filePath, options.projectRoot)
    : [];
  const routes = [...expressRoutes, ...nextRoutes];
  const appAudit = parseResult
    ? runAppLevelAudit(ast, src, { hasRoutes: routes.length > 0, filePath })
    : [];
  const appAuditFiltered = filterByThreshold(appAudit, options.severityThreshold);

  const findings = filterByThreshold(
    [...patternFindings, ...taintFindings, ...appAuditFiltered],
    options.severityThreshold
  );

  return { filePath, findings, source: src, routes, warnings };
}

/** Multi-file scan: per-file findings + merged route graph + middleware audit + optional registry/tests. */
export function scanProject(
  files: { path: string; source: string }[],
  options: ScannerOptions = {}
): ProjectScanResult {
  const fileResults: ScanResult[] = [];
  const packageJsonPath = findPackageJsonNear(options.projectRoot ?? process.cwd());
  const tsProject = createTsProjectContext(files, options);
  const allRoutes = extractRouteGraphFromFiles(files, options.projectRoot, tsProject);
  const allFindings: Finding[] = [];
  const warnings: ScanWarning[] = [...(tsProject?.warnings ?? [])];

  for (const f of files) {
    const one = scan(f.source, f.path, options, { tsProject });
    fileResults.push(one);
    allFindings.push(...one.findings);
    if (one.warnings?.length) warnings.push(...one.warnings);
  }

  const mw = filterByThreshold(runMiddlewareAudit(allRoutes), options.severityThreshold);
  allFindings.push(...mw);

  const specPaths = resolveOpenApiSpecPaths(
    options.projectRoot,
    options.openApiSpecPaths,
    options.openApiDiscovery
  );
  if (specPaths.length > 0) {
    const drift = filterByThreshold(
      runOpenApiDriftAudit(allRoutes, specPaths),
      options.severityThreshold
    );
    allFindings.push(...drift);
  }

  const posture = filterByThreshold(runRoutePostureFinding(allRoutes), options.severityThreshold);
  allFindings.push(...posture);

  const wh = filterByThreshold(runWebhookAudit(allRoutes), options.severityThreshold);
  allFindings.push(...wh);

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

function extractRouteGraphFromFiles(
  files: { path: string; source: string }[],
  projectRoot?: string,
  tsProject?: TsProjectContext | null
): import("./types.js").RouteNode[] {
  const routes: import("./types.js").RouteNode[] = [];
  for (const f of files) {
    const pr = parseFile(f.source, f.path, { tsProject });
    if (!pr) continue;
    routes.push(...extractRouteGraph(pr.ast, pr.source, f.path));
    routes.push(...extractNextAppRouteHandlers(pr.ast, pr.source, f.path, projectRoot));
  }
  return routes;
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

  if (opts.checkRegistry && !opts.skipRegistry && packageJsonPath) {
    const slop = await checkDependencies(packageJsonPath, { skipRegistry: opts.skipRegistry });
    base.findings.push(...filterByThreshold(slop, opts.severityThreshold));
  }

  if (opts.generateTests && opts.generateTestsOutputDir) {
    const written = generateTests(base.findings, opts.generateTestsOutputDir, { projectRoot: root });
    if (written.length > 0) {
      console.error(
        `VibeScan: wrote ${written.length} local proof-oriented test file(s) under ${opts.generateTestsOutputDir}`
      );
    }
  }

  return {
    ...base,
    packageJsonPath,
    thirdPartySurface: base.thirdPartySurface
      ? {
          ...base.thirdPartySurface,
          packageJsonPath: base.thirdPartySurface.packageJsonPath ?? packageJsonPath,
        }
      : base.thirdPartySurface,
  };
}

// Async wrapper around sync scan (API compatibility for callers; mode does not change per-file results).
export async function scanAsync(
  source: string,
  filePath: string,
  options: ScannerOptions = {}
): Promise<ScanResult> {
  return Promise.resolve(scan(source, filePath, options));
}

export { cryptoRules, injectionRules } from "../attacks/index.js";
