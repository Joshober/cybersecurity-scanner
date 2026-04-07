// Next.js App Router: map app/**/route.{ts,js} to URL paths and extract exported HTTP handlers.

import { relative, resolve } from "node:path";
import type { Function as EstreeFunction, Node, Program } from "estree";
import type { RouteNode } from "../types.js";
import { pathParamsFromRoute } from "./routeGraph.js";
import { walk } from "../walker.js";

const ROUTE_BASENAME =
  /^route\.(m?[tj]sx?|mjs|cjs|mts|cts)$/i;

const HTTP_EXPORT = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]);

function normalizePathSeparators(p: string): string {
  return p.replace(/\\/g, "/");
}

function sliceSource(source: string, node: Node): string {
  const loc = node.loc;
  if (!loc?.end) return "";
  const lines = source.split("\n");
  if (loc.start.line === loc.end.line) {
    const line = lines[loc.start.line - 1] ?? "";
    return line.slice(loc.start.column, loc.end.column);
  }
  const first = (lines[loc.start.line - 1] ?? "").slice(loc.start.column);
  const mid = lines.slice(loc.start.line, loc.end.line - 1);
  const last = (lines[loc.end.line - 1] ?? "").slice(0, loc.end.column);
  return [first, ...mid, last].join("\n");
}

function unwrapTypedFunctionExpression(node: Node | null | undefined): EstreeFunction | null {
  if (!node) return null;
  let current: { type: string; expression?: Node } = node as unknown as {
    type: string;
    expression?: Node;
  };
  for (;;) {
    if (current.type === "FunctionExpression" || current.type === "ArrowFunctionExpression") {
      return current as unknown as EstreeFunction;
    }
    if (
      current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSNonNullExpression"
    ) {
      if (!current.expression) return null;
      current = current.expression as unknown as { type: string; expression?: Node };
      continue;
    }
    return null;
  }
}

function collectReqFields(fn: EstreeFunction): {
  bodyFields: string[];
  queryFields: string[];
  paramsFields: string[];
} {
  const bodyFields = new Set<string>();
  const queryFields = new Set<string>();
  const paramsFields = new Set<string>();

  walk(fn as unknown as Node, (n) => {
    if (n.type !== "MemberExpression") return;
    const sub =
      n.property.type === "Identifier"
        ? n.property.name
        : n.property.type === "Literal" && typeof n.property.value === "string"
          ? n.property.value
          : null;
    if (
      !sub ||
      n.object.type !== "MemberExpression" ||
      n.object.object.type !== "Identifier"
    )
      return;
    const reqObj = n.object.object.name;
    const part = n.object.property.type === "Identifier" ? n.object.property.name : null;
    if (!part) return;
    if (reqObj !== "req" && reqObj !== "request") return;
    if (part === "body") bodyFields.add(sub);
    else if (part === "query" || part === "nextUrl") queryFields.add(sub);
    else if (part === "params") paramsFields.add(sub);
  });

  return {
    bodyFields: [...bodyFields],
    queryFields: [...queryFields],
    paramsFields: [...paramsFields],
  };
}

function mapSegmentToUrl(seg: string): string | null {
  if (/^\([^)/]+\)$/.test(seg)) return null;
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(seg) || /^\[\.\.\.[^\]]+\]$/.test(seg)) return "/*";
  const br = /^\[([^\]]+)\]$/.exec(seg);
  if (br) return `:${br[1]}`;
  return seg;
}

function segmentsToFullPath(segments: string[]): string {
  let out = "";
  for (const seg of segments) {
    const mapped = mapSegmentToUrl(seg);
    if (mapped === null) continue;
    if (mapped === "/*") {
      if (out === "") out = "/*";
      else out = out.endsWith("/") ? `${out}*` : `${out}/*`;
    } else {
      const part = mapped.startsWith("/") ? mapped : `/${mapped}`;
      out += part;
    }
  }
  if (out === "") return "/";
  return out.startsWith("/") ? out : `/${out}`;
}

/**
 * If `filePath` is a Next.js App Router route module, return the URL pathname (Express-style :params).
 * Requires `projectRoot` when possible; otherwise infers from a path containing `(src/)app/`.
 */
export function nextAppRouteFileToUrlPath(filePath: string, projectRoot?: string): string | null {
  const norm = normalizePathSeparators(filePath);
  const base = norm.split("/").pop() ?? "";
  if (!ROUTE_BASENAME.test(base)) return null;

  let afterApp: string | null = null;

  if (projectRoot) {
    const relRaw = relative(resolve(projectRoot), resolve(filePath));
    const rel = normalizePathSeparators(relRaw);
    if (rel.startsWith("..") || rel.includes("/../")) return null;
    const m = /^(?:src\/)?app\/(.+)\/route\.[^/]+$/i.exec(rel);
    if (m) afterApp = m[1]!;
  }

  if (afterApp === null) {
    const idx = /(?:^|[\\/])(?:src[\\/])?app[\\/]/i.exec(norm);
    if (!idx) return null;
    const start = idx.index + idx[0].length;
    const rest = norm.slice(start);
    const cut = rest.replace(/\/route\.[^/]+$/i, "");
    afterApp = normalizePathSeparators(cut);
  }

  const segments = afterApp.split("/").filter(Boolean);
  return segmentsToFullPath(segments);
}

/** Exported HTTP verbs from a Next.js `route` module (App Router). */
export function extractNextAppRouteHandlers(
  ast: Program,
  source: string,
  filePath: string,
  projectRoot?: string
): RouteNode[] {
  const fullPath = nextAppRouteFileToUrlPath(filePath, projectRoot);
  if (!fullPath) return [];

  const routes: RouteNode[] = [];

  for (const stmt of ast.body) {
    if (stmt.type !== "ExportNamedDeclaration") continue;
    const decl = stmt.declaration;
    if (!decl) continue;

    const names: { name: string; line: number; fn: EstreeFunction | null }[] = [];

    if (decl.type === "FunctionDeclaration" && decl.id) {
      names.push({
        name: decl.id.name,
        line: decl.loc?.start.line ?? stmt.loc?.start.line ?? 0,
        fn: decl,
      });
    } else if (decl.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (d.id.type !== "Identifier") continue;
        const fn = unwrapTypedFunctionExpression(d.init);
        names.push({
          name: d.id.name,
          line: d.loc?.start.line ?? stmt.loc?.start.line ?? 0,
          fn,
        });
      }
    }

    for (const { name, line, fn } of names) {
      if (!HTTP_EXPORT.has(name)) continue;
      const method = name.toUpperCase() as RouteNode["method"];
      const params = pathParamsFromRoute(fullPath);
      let bodyFields: string[] = [];
      let queryFields: string[] = [];
      let paramsFields: string[] = [];
      let handlerSource = "";
      if (fn) {
        const f = collectReqFields(fn);
        bodyFields = f.bodyFields;
        queryFields = f.queryFields;
        paramsFields = f.paramsFields;
        handlerSource = sliceSource(source, fn);
      }
      routes.push({
        method,
        path: fullPath,
        fullPath,
        params,
        bodyFields,
        queryFields,
        paramsFields,
        middlewares: [],
        file: filePath,
        line,
        handlerSource,
      });
    }
  }

  return routes;
}
