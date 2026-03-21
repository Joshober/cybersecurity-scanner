// Main scan pipeline: parse, pattern rules, taint, route graph, audits, optional registry/tests.

import type { Finding, ScannerOptions, ScanResult, ProjectScanResult } from "./types.js";
import type { Rule } from "./utils/rule-types.js";
import { parseFile } from "./parser/parseFile.js";
import { extractRouteGraph } from "./parser/routeGraph.js";
import {
  runRuleEngine,
  runTaintEngine,
  runMiddlewareAudit,
  runAppLevelAudit,
  generateTests,
  SEVERITY_ORDER,
} from "./engine/index.js";
import { cryptoRules, injectionRules } from "../attacks/index.js";
import { scanWithAi } from "./ai/ai-analyzer.js";
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

// Scan one file: parse to AST, run pattern rules, taint, route extraction, app-level audit.
export function scan(
  source: string,
  filePath: string,
  options: ScannerOptions = {}
): ScanResult {
  const parseResult = parseFile(source);
  if (!parseResult) {
    return { filePath, findings: [], source };
  }
  const { ast, source: src } = parseResult;
  const rules = getRules(options);

  const patternFindings: Finding[] = runRuleEngine({
    filePath,
    source: src,
    ast,
    rules,
    options,
  });

  const taintFindings: Finding[] =
    options.injection !== false
      ? runTaintEngine({
          filePath,
          source: src,
          ast,
          options,
        })
      : [];

  const routes = extractRouteGraph(ast, src, filePath);
  const appAudit = runAppLevelAudit(ast, src, { hasRoutes: routes.length > 0, filePath });
  const appAuditFiltered = filterByThreshold(appAudit, options.severityThreshold);

  const findings = filterByThreshold(
    [...patternFindings, ...taintFindings, ...appAuditFiltered],
    options.severityThreshold
  );

  return { filePath, findings, source: src, routes };
}

/** Multi-file scan: per-file findings + merged route graph + middleware audit + optional registry/tests. */
export function scanProject(
  files: { path: string; source: string }[],
  options: ScannerOptions = {}
): ProjectScanResult {
  const fileResults: ScanResult[] = [];
  const allRoutes = extractRouteGraphFromFiles(files);
  const allFindings: Finding[] = [];

  for (const f of files) {
    const one = scan(f.source, f.path, options);
    fileResults.push(one);
    allFindings.push(...one.findings);
  }

  const mw = filterByThreshold(runMiddlewareAudit(allRoutes), options.severityThreshold);
  allFindings.push(...mw);

  return {
    fileResults,
    routes: allRoutes,
    findings: allFindings,
  };
}

function extractRouteGraphFromFiles(files: { path: string; source: string }[]): import("./types.js").RouteNode[] {
  const routes: import("./types.js").RouteNode[] = [];
  for (const f of files) {
    const pr = parseFile(f.source);
    if (!pr) continue;
    routes.push(...extractRouteGraph(pr.ast, pr.source, f.path));
  }
  return routes;
}

export async function scanProjectAsync(
  files: { path: string; source: string }[],
  options: ScannerOptions = {},
  projectRoot?: string
): Promise<ProjectScanResult> {
  const base = scanProject(files, options);
  const root = projectRoot ?? process.cwd();
  let packageJsonPath = findPackageJsonNear(root);
  if (options.projectRoot) packageJsonPath = findPackageJsonNear(options.projectRoot) ?? packageJsonPath;

  if (options.checkRegistry && !options.skipRegistry && packageJsonPath) {
    const slop = await checkDependencies(packageJsonPath, { skipRegistry: options.skipRegistry });
    base.findings.push(...filterByThreshold(slop, options.severityThreshold));
  }

  if (options.generateTests && options.generateTestsOutputDir) {
    generateTests(base.findings, options.generateTestsOutputDir);
  }

  return { ...base, packageJsonPath };
}

// Async scan: when mode is "ai" runs AI analysis; otherwise same result as sync scan().
export async function scanAsync(
  source: string,
  filePath: string,
  options: ScannerOptions = {}
): Promise<ScanResult> {
  if (options.mode === "ai") {
    return scanWithAi(source, filePath, options);
  }
  return Promise.resolve(scan(source, filePath, options));
}

export { cryptoRules, injectionRules } from "../attacks/index.js";
