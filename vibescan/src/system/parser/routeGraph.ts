// Express route + mount extraction for middleware audit (single-file, source-order mounts).

import type { CallExpression, Expression, Function as EstreeFunction, Node, Program } from "estree";
import type { RouteNode } from "../types.js";
import { walk } from "../walker.js";

const HTTP_METHODS = new Set(["get", "head", "post", "put", "patch", "delete"]);

function joinPaths(base: string, segment: string): string {
  if (!segment || segment === "/") {
    return base && base !== "" ? (base.startsWith("/") ? base : `/${base}`) : "/";
  }
  const s = segment.startsWith("/") ? segment : `/${segment}`;
  if (!base || base === "" || base === "/") return s;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${b}${s}`;
}

export function pathParamsFromRoute(path: string): string[] {
  const out: string[] = [];
  const re = /:([a-zA-Z_][\w]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path))) out.push(m[1]);
  return out;
}

function literalString(e: Expression | null | undefined): string | null {
  if (!e) return null;
  if (e.type === "Literal" && typeof e.value === "string") return e.value;
  return null;
}

function isExpressAppInit(init: Expression | null | undefined): boolean {
  if (!init || init.type !== "CallExpression") return false;
  const c = init.callee;
  return c.type === "Identifier" && c.name === "express";
}

function isExpressRouterInit(init: Expression | null | undefined): boolean {
  if (!init || init.type !== "CallExpression") return false;
  const c = init.callee;
  return (
    c.type === "MemberExpression" &&
    c.object.type === "Identifier" &&
    c.object.name === "express" &&
    c.property.type === "Identifier" &&
    c.property.name === "Router"
  );
}

function calleeMemberInfo(
  expr: CallExpression
): { objectName: string | null; prop: string | null } {
  const c = expr.callee;
  if (c.type !== "MemberExpression") return { objectName: null, prop: null };
  const prop =
    c.property.type === "Identifier"
      ? c.property.name
      : c.property.type === "Literal" && typeof c.property.value === "string"
        ? String(c.property.value)
        : null;
  if (c.object.type === "Identifier") return { objectName: c.object.name, prop };
  return { objectName: null, prop };
}

function handlerName(node: Expression): string {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression" && node.property.type === "Identifier") {
    if (node.object.type === "Identifier") return `${node.object.name}.${node.property.name}`;
  }
  return "anonymous";
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
      n.object.object.type !== "Identifier" ||
      n.object.property.type !== "Identifier"
    )
      return;
    const reqObj = n.object.object.name;
    const part = n.object.property.name;
    if (reqObj !== "req" && reqObj !== "request") return;
    if (part === "body") bodyFields.add(sub);
    else if (part === "query") queryFields.add(sub);
    else if (part === "params") paramsFields.add(sub);
  });

  return {
    bodyFields: [...bodyFields],
    queryFields: [...queryFields],
    paramsFields: [...paramsFields],
  };
}

function lastHandler(args: CallExpression["arguments"]): EstreeFunction | null {
  for (let i = args.length - 1; i >= 0; i--) {
    const a = args[i];
    if (!a || a.type === "SpreadElement") continue;
    if (a.type === "FunctionExpression" || a.type === "ArrowFunctionExpression") return a;
  }
  return null;
}

function middlewareNamesForArgs(args: CallExpression["arguments"]): string[] {
  if (args.length <= 1) return [];
  const names: string[] = [];
  for (let i = 0; i < args.length - 1; i++) {
    const a = args[i];
    if (!a || a.type === "SpreadElement") continue;
    names.push(handlerName(a as Expression));
  }
  return names;
}

/** Extract Express routes from one file's AST (mounts + HTTP verbs). */
export function extractRouteGraph(ast: Program, source: string, file: string): RouteNode[] {
  const expressInstances = new Set<string>();
  const routerVars = new Set<string>();

  walk(ast, (node) => {
    if (node.type !== "VariableDeclarator") return;
    const id = node.id;
    if (id.type !== "Identifier") return;
    if (isExpressAppInit(node.init)) expressInstances.add(id.name);
    if (isExpressRouterInit(node.init)) {
      expressInstances.add(id.name);
      routerVars.add(id.name);
    }
  });

  const baseFor = new Map<string, string>();
  for (const name of expressInstances) baseFor.set(name, "");

  const calls: CallExpression[] = [];
  walk(ast, (node) => {
    if (node.type === "CallExpression") calls.push(node);
  });
  calls.sort((a, b) => (a.loc?.start.line ?? 0) - (b.loc?.start.line ?? 0));

  const routes: RouteNode[] = [];

  for (const call of calls) {
    const { objectName, prop } = calleeMemberInfo(call);
    if (!objectName || !prop || !expressInstances.has(objectName)) continue;

    if (prop === "use") {
      const args = call.arguments;
      if (args.length === 0) continue;
      const first = args[0];
      const second = args[1];
      let mountPath = "";
      let routerId: string | null = null;
      if (second && second.type === "Identifier") {
        mountPath = literalString(first as Expression) ?? "";
        routerId = second.name;
      } else if (first.type === "Identifier") {
        routerId = first.name;
        mountPath = "";
      }
      if (routerId && expressInstances.has(routerId)) {
        const parentBase = baseFor.get(objectName) ?? "";
        baseFor.set(routerId, joinPaths(parentBase, mountPath));
      }
      continue;
    }

    if (!HTTP_METHODS.has(prop)) continue;
    const method = prop.toUpperCase() as RouteNode["method"];
    const args = call.arguments;
    if (args.length === 0) continue;
    const a0 = args[0];
    const pathStr =
      a0 && a0.type !== "SpreadElement" ? literalString(a0 as Expression) : null;
    if (pathStr === null) continue;
    const parentBase = baseFor.get(objectName) ?? "";
    const fullPath = joinPaths(parentBase, pathStr);
    const params = pathParamsFromRoute(pathStr);
    const middlewares = middlewareNamesForArgs(args);
    const handler = lastHandler(args);
    let bodyFields: string[] = [];
    let queryFields: string[] = [];
    let paramsFields: string[] = [];
    let handlerSource = "";
    const line = call.loc?.start.line ?? 0;
    if (handler) {
      const f = collectReqFields(handler);
      bodyFields = f.bodyFields;
      queryFields = f.queryFields;
      paramsFields = f.paramsFields;
      handlerSource = sliceSource(source, handler);
    }
    routes.push({
      method,
      path: pathStr,
      fullPath,
      params,
      bodyFields,
      queryFields,
      paramsFields,
      middlewares,
      file,
      line,
      handlerSource,
    });
  }

  return routes;
}
