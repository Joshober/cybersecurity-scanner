import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, isAbsolute, join } from "node:path";
import fg from "fast-glob";
import type { CallExpression, Identifier } from "estree";
import type {
  DependencyKind,
  Finding,
  ProjectScanResult,
  RouteInventoryEntry,
  RouteNode,
  Severity,
  ThirdPartyFindingTouchpoint,
  ThirdPartyImportEdge,
  ThirdPartyImportSpecifier,
  ThirdPartyPackageSurface,
  ThirdPartyRouteTouchpoint,
  ThirdPartySurfaceReport,
} from "../types.js";
import { buildParentMap, walk } from "../walker.js";
import { parseFile } from "../parser/parseFile.js";
import { findPackageJsonNear } from "../ai/slopsquat.js";

interface DependencyMeta {
  packageJsonPath?: string;
  dependencyKinds: Map<string, DependencyKind>;
  workspaceNames: Set<string>;
}

interface BindingRef {
  packageName: string;
  localName: string;
}

interface BindingUsage {
  usageCount: number;
  callCount: number;
  lines: Set<number>;
  callLines: Set<number>;
}

interface FileAnalysis {
  filePath: string;
  imports: ThirdPartyImportEdge[];
  bindingRefs: Map<string, BindingRef[]>;
  bindingUsage: Map<string, BindingUsage>;
}

const BUILTIN_MODULES = new Set(
  builtinModules.flatMap((name) => (name.startsWith("node:") ? [name, name.slice(5)] : [name, `node:${name}`]))
);

const SENSITIVE_ROUTE_TAGS = new Set(["admin", "auth-sensitive", "upload", "webhook"]);

function severityRank(sev: Severity): number {
  if (sev === "critical") return 3;
  if (sev === "error") return 2;
  if (sev === "warning") return 1;
  return 0;
}

function maxSeverity(a: Severity, b: Severity): Severity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

function packageRoot(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  const parts = specifier.split("/");
  return parts[0] || specifier;
}

function isLocalSpecifier(specifier: string): boolean {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/") ||
    specifier.startsWith("file:")
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesBinding(text: string | undefined, bindingName: string): boolean {
  if (!text || !bindingName) return false;
  return new RegExp(`\\b${escapeRegExp(bindingName)}\\b`).test(text);
}

function workspacePackageNames(packageJsonDir: string, workspacePatterns: string[]): Set<string> {
  const names = new Set<string>();
  for (const pattern of workspacePatterns) {
    const matches = fg.sync(pattern.replace(/\\/g, "/"), {
      cwd: packageJsonDir,
      onlyFiles: false,
      markDirectories: true,
    });
    for (const rel of matches) {
      const pj = join(packageJsonDir, rel, "package.json");
      if (!existsSync(pj)) continue;
      try {
        const meta = JSON.parse(readFileSync(pj, "utf-8")) as { name?: string };
        if (typeof meta.name === "string" && meta.name.length > 0) names.add(meta.name);
      } catch {
        /* ignore malformed workspace package.json */
      }
    }
  }
  return names;
}

function loadDependencyMeta(projectRoot?: string): DependencyMeta {
  const packageJsonPath = projectRoot ? findPackageJsonNear(projectRoot) : undefined;
  if (!packageJsonPath || !existsSync(packageJsonPath)) {
    return { dependencyKinds: new Map<string, DependencyKind>(), workspaceNames: new Set<string>() };
  }

  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      workspaces?: string[] | { packages?: string[] };
    };
    const kinds = new Map<string, DependencyKind>();
    for (const name of Object.keys(pkg.dependencies ?? {})) kinds.set(name, "dependency");
    for (const name of Object.keys(pkg.devDependencies ?? {})) {
      if (!kinds.has(name)) kinds.set(name, "devDependency");
    }
    for (const name of Object.keys(pkg.peerDependencies ?? {})) {
      if (!kinds.has(name)) kinds.set(name, "peerDependency");
    }
    for (const name of Object.keys(pkg.optionalDependencies ?? {})) {
      if (!kinds.has(name)) kinds.set(name, "optionalDependency");
    }
    const workspaces = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : Array.isArray(pkg.workspaces?.packages)
        ? pkg.workspaces.packages
        : [];
    return {
      packageJsonPath,
      dependencyKinds: kinds,
      workspaceNames: workspacePackageNames(dirname(packageJsonPath), workspaces),
    };
  } catch {
    return { packageJsonPath, dependencyKinds: new Map<string, DependencyKind>(), workspaceNames: new Set<string>() };
  }
}

function isExternalPackage(specifier: string, meta: DependencyMeta): boolean {
  if (!specifier || isLocalSpecifier(specifier) || isAbsolute(specifier)) return false;
  if (BUILTIN_MODULES.has(specifier)) return false;
  return !meta.workspaceNames.has(packageRoot(specifier));
}

function dependencyKindFor(specifier: string, meta: DependencyMeta): DependencyKind {
  return meta.dependencyKinds.get(packageRoot(specifier)) ?? "unknown";
}

function literalImportSource(node: { source?: unknown }): string | null {
  const raw = node.source as { type?: string; value?: unknown } | undefined;
  if (raw?.type === "Literal" && typeof raw.value === "string") return raw.value;
  return null;
}

function ensureUsage(map: Map<string, BindingUsage>, bindingName: string): BindingUsage {
  let usage = map.get(bindingName);
  if (!usage) {
    usage = { usageCount: 0, callCount: 0, lines: new Set<number>(), callLines: new Set<number>() };
    map.set(bindingName, usage);
  }
  return usage;
}

function addBindingRef(map: Map<string, BindingRef[]>, bindingName: string, ref: BindingRef): void {
  if (!bindingName) return;
  const list = map.get(bindingName) ?? [];
  list.push(ref);
  map.set(bindingName, list);
}

function isIdentifierReference(node: Identifier, parent: unknown): boolean {
  if (!parent || typeof parent !== "object") return true;
  const p = parent as Record<string, unknown>;
  const parentType = typeof p.type === "string" ? p.type : "";
  if (
    parentType === "ImportSpecifier" ||
    parentType === "ImportDefaultSpecifier" ||
    parentType === "ImportNamespaceSpecifier"
  ) {
    return false;
  }
  if (parentType === "VariableDeclarator" && p.id === node) return false;
  if (parentType === "Property" && p.key === node && p.computed !== true) return false;
  if (parentType === "MemberExpression" && p.property === node && p.computed !== true) return false;
  if (parentType === "FunctionDeclaration" && p.id === node) return false;
  if (parentType === "ClassDeclaration" && p.id === node) return false;
  return true;
}

function rootIdentifierName(node: CallExpression["callee"]): string | null {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    let current = node.object;
    while (current.type === "MemberExpression") current = current.object;
    return current.type === "Identifier" ? current.name : null;
  }
  return null;
}

function findReferencedBindings(text: string | undefined, bindingUsage: Map<string, BindingUsage>): string[] {
  if (!text) return [];
  const matched: string[] = [];
  for (const bindingName of bindingUsage.keys()) {
    if (includesBinding(text, bindingName)) matched.push(bindingName);
  }
  return matched.sort((a, b) => a.localeCompare(b));
}

function analyzeFile(filePath: string, source: string, meta: DependencyMeta): FileAnalysis {
  const parsed = parseFile(source, filePath);
  if (!parsed) {
    return { filePath, imports: [], bindingRefs: new Map<string, BindingRef[]>(), bindingUsage: new Map<string, BindingUsage>() };
  }

  const bindingRefs = new Map<string, BindingRef[]>();
  const bindingUsage = new Map<string, BindingUsage>();
  const edgesByKey = new Map<string, ThirdPartyImportEdge>();
  const parents = buildParentMap(parsed.ast);

  function upsertEdge(
    moduleSpecifier: string,
    line: number,
    specifier: ThirdPartyImportSpecifier
  ): ThirdPartyImportEdge | null {
    if (!isExternalPackage(moduleSpecifier, meta)) return null;
    const pkgName = packageRoot(moduleSpecifier);
    const key = `${line}:${moduleSpecifier}`;
    let edge = edgesByKey.get(key);
    if (!edge) {
      edge = {
        filePath,
        packageName: pkgName,
        moduleSpecifier,
        line,
        dependencyKind: dependencyKindFor(moduleSpecifier, meta),
        specifiers: [],
        importedBindings: [],
        usageCount: 0,
        callCount: 0,
      };
      edgesByKey.set(key, edge);
    }
    edge.specifiers.push(specifier);
    if (specifier.localName) {
      addBindingRef(bindingRefs, specifier.localName, { packageName: pkgName, localName: specifier.localName });
      if (!edge.importedBindings.includes(specifier.localName)) edge.importedBindings.push(specifier.localName);
      ensureUsage(bindingUsage, specifier.localName);
    }
    return edge;
  }

  walk(parsed.ast, (node) => {
    if (node.type === "ImportDeclaration") {
      const spec = literalImportSource(node);
      if (!spec) return;
      const line = node.loc?.start.line ?? 1;
      if (node.specifiers.length === 0) {
        upsertEdge(spec, line, { kind: "side-effect" });
        return;
      }
      for (const s of node.specifiers) {
        if (s.type === "ImportDefaultSpecifier") {
          upsertEdge(spec, line, { kind: "default", localName: s.local.name, importedName: "default" });
        } else if (s.type === "ImportNamespaceSpecifier") {
          upsertEdge(spec, line, { kind: "namespace", localName: s.local.name, importedName: "*" });
        } else if (s.type === "ImportSpecifier") {
          const importedName =
            s.imported.type === "Identifier" ? s.imported.name : String(s.imported.value ?? "unknown");
          upsertEdge(spec, line, { kind: "named", localName: s.local.name, importedName });
        }
      }
      return;
    }

    if ((node.type === "ExportAllDeclaration" || node.type === "ExportNamedDeclaration") && node.source) {
      const spec = literalImportSource(node);
      if (!spec) return;
      upsertEdge(spec, node.loc?.start.line ?? 1, { kind: "re-export" });
      return;
    }

    if (node.type === "ImportExpression") {
      const spec = literalImportSource(node);
      if (!spec) return;
      upsertEdge(spec, node.loc?.start.line ?? 1, { kind: "dynamic-import" });
      return;
    }

    if (node.type === "VariableDeclarator" && node.init?.type === "CallExpression") {
      const call = node.init;
      if (call.callee.type !== "Identifier" || call.callee.name !== "require") return;
      const arg0 = call.arguments[0];
      if (!arg0 || arg0.type === "SpreadElement" || arg0.type !== "Literal" || typeof arg0.value !== "string") {
        return;
      }
      const line = node.loc?.start.line ?? call.loc?.start.line ?? 1;
      if (node.id.type === "Identifier") {
        upsertEdge(arg0.value, line, { kind: "require", localName: node.id.name, importedName: "default" });
      } else if (node.id.type === "ObjectPattern") {
        for (const prop of node.id.properties) {
          if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;
          const local =
            prop.value.type === "Identifier"
              ? prop.value.name
              : prop.value.type === "AssignmentPattern" && prop.value.left.type === "Identifier"
                ? prop.value.left.name
                : undefined;
          upsertEdge(arg0.value, line, {
            kind: "destructured-require",
            localName: local,
            importedName: prop.key.name,
          });
        }
      }
      return;
    }

    if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "require") {
      const arg0 = node.arguments[0];
      if (!arg0 || arg0.type === "SpreadElement" || arg0.type !== "Literal" || typeof arg0.value !== "string") {
        return;
      }
      const parentType = (parents.get(node) as { type?: string } | null)?.type;
      if (parentType !== "VariableDeclarator") {
        upsertEdge(arg0.value, node.loc?.start.line ?? 1, { kind: "side-effect" });
      }
    }
  });

  walk(parsed.ast, (node) => {
    if (node.type === "Identifier") {
      const refs = bindingRefs.get(node.name);
      if (!refs?.length) return;
      const parent = parents.get(node);
      if (!isIdentifierReference(node, parent)) return;
      const usage = ensureUsage(bindingUsage, node.name);
      usage.usageCount += 1;
      const line = node.loc?.start.line;
      if (line) usage.lines.add(line);
      return;
    }

    if (node.type === "CallExpression") {
      const rootName = rootIdentifierName(node.callee);
      if (!rootName || !bindingRefs.has(rootName)) return;
      const usage = ensureUsage(bindingUsage, rootName);
      usage.callCount += 1;
      const line = node.loc?.start.line;
      if (line) usage.callLines.add(line);
    }
  });

  const imports = [...edgesByKey.values()]
    .map((edge) => {
      let usageCount = 0;
      let callCount = 0;
      for (const bindingName of edge.importedBindings) {
        const usage = bindingUsage.get(bindingName);
        if (!usage) continue;
        usageCount += usage.usageCount;
        callCount += usage.callCount;
      }
      return {
        ...edge,
        importedBindings: [...edge.importedBindings].sort((a, b) => a.localeCompare(b)),
        usageCount,
        callCount,
      };
    })
    .sort((a, b) => {
      if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
      if (a.line !== b.line) return a.line - b.line;
      return a.moduleSpecifier.localeCompare(b.moduleSpecifier);
    });

  return { filePath, imports, bindingRefs, bindingUsage };
}

function routeInventoryFor(route: RouteNode, routeInventory: RouteInventoryEntry[] | undefined): RouteInventoryEntry | undefined {
  return routeInventory?.find(
    (entry) => entry.file === route.file && entry.fullPath === route.fullPath && entry.line === route.line
  );
}

function isSensitiveRoute(entry: RouteInventoryEntry | undefined): boolean {
  if (!entry) return false;
  if (entry.sensitivePath || entry.adminPath) return true;
  return entry.tags.some((tag) => SENSITIVE_ROUTE_TAGS.has(tag));
}

function makeRouteReviewFinding(pkg: string, touchpoint: ThirdPartyRouteTouchpoint): Finding {
  return {
    ruleId: "third_party.route.sensitive-touchpoint",
    message: `Sensitive route touches external package "${pkg}".`,
    why:
      "This request path crosses a third-party dependency boundary. Review that package's API contract, validation behavior, and upgrade policy because defects there are outside your direct code control.",
    fix:
      "Wrap external package calls behind a small local adapter, validate request data before the boundary, and pin/monitor the package separately from app-code scanning.",
    remediation:
      "Document the trust boundary, validate inputs before the dependency call, and review package ownership/versioning.",
    severity: "warning",
    severityLabel: "MEDIUM",
    category: "third_party",
    cwe: 829,
    owasp: "A06:2021",
    line: touchpoint.line,
    column: 0,
    filePath: touchpoint.filePath,
    packageName: pkg,
    route: {
      method: touchpoint.method,
      path: touchpoint.path,
      fullPath: touchpoint.fullPath,
      middlewares: [],
      middlewareEvidence: touchpoint.tags,
    },
  };
}

function makeFindingReviewFinding(pkg: string, touchpoint: ThirdPartyFindingTouchpoint): Finding {
  return {
    ruleId: "third_party.flow.tainted-package-touchpoint",
    message: `Existing security finding also touches external package "${pkg}".`,
    why:
      "The vulnerable or risky code path crosses a third-party package boundary, which makes root-cause analysis and remediation depend partly on external code or API behavior.",
    fix:
      "Confirm the exact API contract at this boundary, constrain inputs before the package call, and isolate dependency use behind a reviewed wrapper where practical.",
    remediation:
      "Review the dependency API used on this path and contain untrusted data before crossing the boundary.",
    severity: touchpoint.sourceLabel && touchpoint.sinkLabel ? "warning" : "info",
    severityLabel: touchpoint.sourceLabel && touchpoint.sinkLabel ? "MEDIUM" : "LOW",
    category: "third_party",
    cwe: 829,
    owasp: "A06:2021",
    line: touchpoint.line,
    column: 0,
    filePath: touchpoint.filePath,
    packageName: pkg,
    sourceLabel: touchpoint.sourceLabel,
    sinkLabel: touchpoint.sinkLabel,
  };
}

export function analyzeThirdPartySurface(
  files: { path: string; source: string }[],
  project: Pick<ProjectScanResult, "findings" | "routes" | "routeInventory">,
  projectRoot?: string
): ThirdPartySurfaceReport {
  const dependencyMeta = loadDependencyMeta(projectRoot);
  const perFile = new Map<string, FileAnalysis>();
  for (const file of files) perFile.set(file.path, analyzeFile(file.path, file.source, dependencyMeta));

  const imports = [...perFile.values()]
    .flatMap((analysis) => analysis.imports)
    .sort((a, b) => {
      if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
      if (a.line !== b.line) return a.line - b.line;
      return a.packageName.localeCompare(b.packageName);
    });

  const routeTouchpoints: ThirdPartyRouteTouchpoint[] = [];
  for (const route of project.routes) {
    const analysis = perFile.get(route.file);
    if (!analysis) continue;
    const matchedBindings = findReferencedBindings(route.handlerSource, analysis.bindingUsage);
    if (matchedBindings.length === 0) continue;
    const pkgToBindings = new Map<string, string[]>();
    for (const bindingName of matchedBindings) {
      for (const ref of analysis.bindingRefs.get(bindingName) ?? []) {
        const list = pkgToBindings.get(ref.packageName) ?? [];
        if (!list.includes(bindingName)) list.push(bindingName);
        pkgToBindings.set(ref.packageName, list);
      }
    }
    const inventoryEntry = routeInventoryFor(route, project.routeInventory);
    const tags = inventoryEntry?.tags ?? [];
    for (const [packageName, importedBindings] of pkgToBindings.entries()) {
      routeTouchpoints.push({
        packageName,
        filePath: route.file,
        method: route.method,
        path: route.path,
        fullPath: route.fullPath,
        line: route.line,
        tags: [...tags].sort((a, b) => a.localeCompare(b)),
        importedBindings: [...importedBindings].sort((a, b) => a.localeCompare(b)),
      });
    }
  }

  const findingTouchpoints: ThirdPartyFindingTouchpoint[] = [];
  for (const finding of project.findings) {
    const filePath = finding.filePath;
    if (!filePath) continue;
    const analysis = perFile.get(filePath);
    if (!analysis) continue;

    const matchedBindings = new Set<string>();
    for (const bindingName of findReferencedBindings(finding.source, analysis.bindingUsage)) matchedBindings.add(bindingName);
    for (const bindingName of findReferencedBindings(finding.sourceLabel, analysis.bindingUsage)) matchedBindings.add(bindingName);
    for (const bindingName of findReferencedBindings(finding.sinkLabel, analysis.bindingUsage)) matchedBindings.add(bindingName);
    for (const [bindingName, usage] of analysis.bindingUsage.entries()) {
      if (usage.callLines.has(finding.line) || usage.lines.has(finding.line)) matchedBindings.add(bindingName);
    }
    if (finding.route) {
      for (const routeTouchpoint of routeTouchpoints) {
        if (
          routeTouchpoint.filePath === filePath &&
          routeTouchpoint.fullPath === finding.route.fullPath &&
          routeTouchpoint.method === finding.route.method
        ) {
          for (const bindingName of routeTouchpoint.importedBindings) matchedBindings.add(bindingName);
        }
      }
    }

    const pkgToBindings = new Map<string, string[]>();
    for (const bindingName of matchedBindings) {
      for (const ref of analysis.bindingRefs.get(bindingName) ?? []) {
        const list = pkgToBindings.get(ref.packageName) ?? [];
        if (!list.includes(bindingName)) list.push(bindingName);
        pkgToBindings.set(ref.packageName, list);
      }
    }

    for (const [packageName, importedBindings] of pkgToBindings.entries()) {
      findingTouchpoints.push({
        packageName,
        filePath,
        ruleId: finding.ruleId,
        severity: finding.severity,
        line: finding.line,
        sourceLabel: finding.sourceLabel,
        sinkLabel: finding.sinkLabel,
        importedBindings: [...importedBindings].sort((a, b) => a.localeCompare(b)),
      });
    }
  }

  const packagesByName = new Map<string, ThirdPartyPackageSurface>();
  function ensurePackage(pkg: string): ThirdPartyPackageSurface {
    let entry = packagesByName.get(pkg);
    if (!entry) {
      entry = {
        packageName: pkg,
        dependencyKinds: [],
        files: [],
        importedBindings: [],
        importEdges: [],
        routeTouchpoints: [],
        findingTouchpoints: [],
        riskLabels: [],
        highestSeverity: "info",
      };
      packagesByName.set(pkg, entry);
    }
    return entry;
  }

  for (const imp of imports) {
    const pkg = ensurePackage(imp.packageName);
    if (!pkg.dependencyKinds.includes(imp.dependencyKind)) pkg.dependencyKinds.push(imp.dependencyKind);
    if (!pkg.files.includes(imp.filePath)) pkg.files.push(imp.filePath);
    for (const binding of imp.importedBindings) {
      if (!pkg.importedBindings.includes(binding)) pkg.importedBindings.push(binding);
    }
    pkg.importEdges.push(imp);
  }

  for (const touchpoint of routeTouchpoints) {
    const pkg = ensurePackage(touchpoint.packageName);
    pkg.routeTouchpoints.push(touchpoint);
    if (!pkg.riskLabels.includes("route_touchpoint")) pkg.riskLabels.push("route_touchpoint");
    const inventoryEntry = project.routeInventory?.find(
      (entry) => entry.file === touchpoint.filePath && entry.fullPath === touchpoint.fullPath && entry.line === touchpoint.line
    );
    if (isSensitiveRoute(inventoryEntry) && !pkg.riskLabels.includes("sensitive_route")) {
      pkg.riskLabels.push("sensitive_route");
    }
  }

  for (const touchpoint of findingTouchpoints) {
    const pkg = ensurePackage(touchpoint.packageName);
    pkg.findingTouchpoints.push(touchpoint);
    pkg.highestSeverity = maxSeverity(pkg.highestSeverity, touchpoint.severity);
    if (!pkg.riskLabels.includes("security_finding")) pkg.riskLabels.push("security_finding");
    if (touchpoint.sourceLabel && touchpoint.sinkLabel && !pkg.riskLabels.includes("tainted_flow")) {
      pkg.riskLabels.push("tainted_flow");
    }
  }

  const reviewFindings: Finding[] = [];
  const reviewKeys = new Set<string>();
  for (const pkg of packagesByName.values()) {
    for (const routeTouchpoint of pkg.routeTouchpoints) {
      const inventoryEntry = project.routeInventory?.find(
        (entry) =>
          entry.file === routeTouchpoint.filePath &&
          entry.fullPath === routeTouchpoint.fullPath &&
          entry.line === routeTouchpoint.line
      );
      if (!isSensitiveRoute(inventoryEntry)) continue;
      const key = `route:${pkg.packageName}:${routeTouchpoint.filePath}:${routeTouchpoint.fullPath}:${routeTouchpoint.line}`;
      if (reviewKeys.has(key)) continue;
      reviewKeys.add(key);
      reviewFindings.push(makeRouteReviewFinding(pkg.packageName, routeTouchpoint));
    }
    for (const findingTouchpoint of pkg.findingTouchpoints) {
      if (!findingTouchpoint.sourceLabel && !findingTouchpoint.sinkLabel) continue;
      const key = `finding:${pkg.packageName}:${findingTouchpoint.filePath}:${findingTouchpoint.ruleId}:${findingTouchpoint.line}`;
      if (reviewKeys.has(key)) continue;
      reviewKeys.add(key);
      reviewFindings.push(makeFindingReviewFinding(pkg.packageName, findingTouchpoint));
    }
  }

  const packages = [...packagesByName.values()]
    .map((pkg) => ({
      ...pkg,
      dependencyKinds: [...pkg.dependencyKinds].sort((a, b) => a.localeCompare(b)),
      files: [...pkg.files].sort((a, b) => a.localeCompare(b)),
      importedBindings: [...pkg.importedBindings].sort((a, b) => a.localeCompare(b)),
      importEdges: [...pkg.importEdges].sort((a, b) => a.line - b.line || a.filePath.localeCompare(b.filePath)),
      routeTouchpoints: [...pkg.routeTouchpoints].sort(
        (a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line || a.fullPath.localeCompare(b.fullPath)
      ),
      findingTouchpoints: [...pkg.findingTouchpoints].sort(
        (a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line || a.ruleId.localeCompare(b.ruleId)
      ),
      riskLabels: [...pkg.riskLabels].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.packageName.localeCompare(b.packageName));

  return {
    packageJsonPath: dependencyMeta.packageJsonPath,
    summary: {
      packageCount: packages.length,
      importEdgeCount: imports.length,
      routeTouchpointCount: routeTouchpoints.length,
      sensitiveRouteTouchpointCount: routeTouchpoints.filter((touchpoint) => {
        const inventoryEntry = project.routeInventory?.find(
          (entry) =>
            entry.file === touchpoint.filePath &&
            entry.fullPath === touchpoint.fullPath &&
            entry.line === touchpoint.line
        );
        return isSensitiveRoute(inventoryEntry);
      }).length,
      findingTouchpointCount: findingTouchpoints.length,
      taintedFlowTouchpointCount: findingTouchpoints.filter((touchpoint) => !!touchpoint.sourceLabel && !!touchpoint.sinkLabel)
        .length,
      reviewFindingCount: reviewFindings.length,
    },
    imports,
    packages,
    reviewFindings,
  };
}
