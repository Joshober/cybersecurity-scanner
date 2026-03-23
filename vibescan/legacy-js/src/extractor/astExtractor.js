import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = /** @type {typeof import("@babel/traverse").default} */ (
  traverseModule.default ?? traverseModule
);
import * as t from "@babel/types";
import { joinPaths, normalizeRoute, extractPathParams } from "./routeGraph.js";

const HTTP = new Set(["get", "post", "put", "patch", "delete", "all"]);

/**
 * @param {string} dirPath
 * @returns {string[]}
 */
function collectSourceFiles(dirPath) {
  /** @type {string[]} */
  const out = [];
  function walk(d) {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(m?[jt]sx?)$/.test(ent.name)) out.push(full);
    }
  }
  walk(dirPath);
  return out;
}

/**
 * @param {string} source
 * @param {string} filePath
 */
function parseFile(source, filePath) {
  try {
    const ast = parse(source, {
      sourceType: "unambiguous",
      allowImportExportEverywhere: true,
      errorRecovery: true,
      plugins: [
        "typescript",
        "jsx",
        "classProperties",
        "topLevelAwait",
        "optionalChaining",
        "nullishCoalescing",
        "objectRestSpread",
        "dynamicImport",
      ],
    });
    return { path: filePath, source, ast };
  } catch {
    return null;
  }
}

/**
 * @param {import('@babel/types').Node} node
 * @returns {string|null}
 */
function stringFromNode(node) {
  if (t.isStringLiteral(node)) return node.value;
  return null;
}

/**
 * @param {import('@babel/types').Node} node
 * @returns {boolean}
 */
function isExpressCall(node) {
  return (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee) &&
    node.callee.name === "express" &&
    node.arguments.length === 0
  );
}

/**
 * @param {import('@babel/types').Node} node
 * @returns {boolean}
 */
function isExpressRouterCall(node) {
  if (!t.isCallExpression(node)) return false;
  const c = node.callee;
  if (!t.isMemberExpression(c) || c.computed) return false;
  if (!t.isIdentifier(c.object) || c.object.name !== "express") return false;
  const p = c.property;
  if (t.isIdentifier(p) && p.name === "Router") return true;
  return false;
}

/**
 * @param {import('@babel/types').Node} node
 * @returns {string|null}
 */
function middlewareNameFromNode(node) {
  if (t.isIdentifier(node)) return node.name;
  if (t.isMemberExpression(node) && !node.computed) {
    const obj = node.object;
    const prop = node.property;
    if (t.isIdentifier(obj) && t.isIdentifier(prop)) return `${obj.name}.${prop.name}`;
  }
  return "anonymous";
}

/**
 * @param {import('@babel/types').Node} node
 */
function getFinalHandler(routeArgs) {
  if (routeArgs.length === 0) return null;
  return routeArgs[routeArgs.length - 1];
}

/**
 * @param {import('@babel/types').Function} fn
 * @param {string} source
 */
function extractReqFieldsFromFunction(fn, _source) {
  /** @type {Set<string>} */
  const queryParams = new Set();
  /** @type {Set<string>} */
  const bodyFields = new Set();
  /** @type {Set<string>} */
  const paramFields = new Set();

  const wrap = t.file(t.program([t.expressionStatement(fn)]));

  traverse(wrap, {
    MemberExpression(path) {
      const { node } = path;
      if (!t.isIdentifier(node.object, { name: "req" })) return;
      if (!t.isIdentifier(node.property)) return;
      const seg = node.property.name;
      const parent = path.parentPath?.node;
      if (!t.isMemberExpression(parent) || parent.object !== node) return;
      const inner = parent.property;
      if (!t.isIdentifier(inner)) return;
      if (seg === "query") queryParams.add(inner.name);
      else if (seg === "body") bodyFields.add(inner.name);
      else if (seg === "params") paramFields.add(inner.name);
    },
  });

  return {
    queryParams: [...queryParams],
    bodyFields: [...bodyFields],
    paramFields: [...paramFields],
  };
}

/**
 * @param {import('@babel/types').Function} fn
 * @param {string} source
 */
function sliceHandlerSource(fn, source) {
  if (!fn.loc) return "";
  const start = fn.loc.start;
  const end = fn.loc.end;
  const lines = source.split("\n");
  if (start.line === end.line) {
    const line = lines[start.line - 1] ?? "";
    return line.slice(start.column, end.column);
  }
  const chunk = lines.slice(start.line - 1, end.line).join("\n");
  return chunk;
}

/**
 * Resolve base path for a router variable.
 * @param {string} name
 * @param {Map<string, { parent: string|null, segment: string }>} mounts
 * @param {Set<string>} roots
 */
function resolveBasePath(name, mounts, roots, seen = new Set()) {
  if (seen.has(name)) return "";
  seen.add(name);
  if (roots.has(name)) return "";
  const m = mounts.get(name);
  if (!m || !m.parent) return "";
  const parentBase = resolveBasePath(m.parent, mounts, roots, seen);
  return joinPaths(parentBase, m.segment);
}

/**
 * @param {string} filePath
 * @param {string} source
 * @param {import('@babel/types').File} fileAst
 */
function extractRoutesFromFile(filePath, source, fileAst) {
  /** @type {import('../types.js').RouteRecord[]} */
  const routes = [];

  /** @type {Set<string>} */
  const routerVars = new Set();
  /** @type {Set<string>} */
  const appRoots = new Set();
  /** @type {Map<string, { parent: string|null, segment: string }>} */
  const mounts = new Map();

  /** @type {Map<string, string[]>} */
  const useStack = new Map();

  function ensureStack(name) {
    if (!useStack.has(name)) useStack.set(name, []);
    return useStack.get(name);
  }

  function processCall(calleeObj, calleeProp, args, line) {
    const objName = t.isIdentifier(calleeObj) ? calleeObj.name : null;
    const method = t.isIdentifier(calleeProp) ? calleeProp.name : null;
    if (!objName || !method) return;

    const isRouterLike = routerVars.has(objName) || appRoots.has(objName);
    if (!isRouterLike) return;

    if (method === "use") {
      if (args.length >= 2) {
        const p = stringFromNode(args[0]);
        const second = args[1];
        if (p !== null && t.isIdentifier(second) && routerVars.has(second.name)) {
          mounts.set(second.name, { parent: objName, segment: p });
          return;
        }
      }
      const mwArg = args.length >= 2 ? args[1] : args[0];
      if (mwArg) {
        ensureStack(objName).push(middlewareNameFromNode(mwArg));
      }
      return;
    }

    if (!HTTP.has(method)) return;

    const pathPattern = stringFromNode(args[0]) ?? "/";
    const routeArgs = args.slice(1);
    const mws = [...ensureStack(objName)];
    for (let i = 0; i < routeArgs.length - 1; i++) {
      mws.push(middlewareNameFromNode(routeArgs[i]));
    }

    const handler = getFinalHandler(routeArgs);
    let handlerSource = "";
    let queryParams = [];
    let bodyFields = [];
    let paramFields = [];
    /** @type {import('@babel/types').Function|undefined} */
    let handlerNode;
    if (handler && (t.isFunctionExpression(handler) || t.isArrowFunctionExpression(handler))) {
      handlerNode = handler;
      handlerSource = sliceHandlerSource(handler, source);
      const fields = extractReqFieldsFromFunction(handler, source);
      queryParams = fields.queryParams;
      bodyFields = fields.bodyFields;
      paramFields = fields.paramFields;
    }

    const base = resolveBasePath(objName, mounts, appRoots);
    const fullPath = joinPaths(base, pathPattern);
    const methodUpper = method === "all" ? "ALL" : method.toUpperCase();

    routes.push(
      normalizeRoute({
        method: methodUpper,
        path: pathPattern,
        fullPath,
        params: extractPathParams(fullPath),
        queryParams,
        bodyFields,
        reqParamFields: paramFields,
        middlewares: mws,
        file: filePath,
        line,
        handlerSource,
        handlerNode,
        routerVar: objName,
      })
    );
  }

  traverse(fileAst, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      if (!t.isIdentifier(id) || !init) return;
      if (isExpressCall(init)) {
        appRoots.add(id.name);
        routerVars.add(id.name);
        ensureStack(id.name);
      } else if (isExpressRouterCall(init)) {
        routerVars.add(id.name);
        ensureStack(id.name);
      }
    },
    AssignmentExpression(path) {
      const left = path.node.left;
      const right = path.node.right;
      if (!t.isIdentifier(left) || !right) return;
      if (isExpressCall(right)) {
        appRoots.add(left.name);
        routerVars.add(left.name);
        ensureStack(left.name);
      } else if (isExpressRouterCall(right)) {
        routerVars.add(left.name);
        ensureStack(left.name);
      }
    },
    CallExpression(path) {
      const { node } = path;
      const { callee } = node;
      if (!t.isMemberExpression(callee) || callee.computed) return;
      const line = node.loc?.start.line ?? 0;
      processCall(callee.object, callee.property, node.arguments, line);
    },
  });

  return routes;
}

/**
 * @param {string} dirPath
 * @returns {import('../types.js').ExtractResult}
 */
export function extractRoutes(dirPath) {
  const abs = path.resolve(dirPath);
  const files = collectSourceFiles(abs);
  /** @type {import('../types.js').ParsedFile[]} */
  const parsed = [];
  /** @type {import('../types.js').RouteRecord[]} */
  const routes = [];

  for (const filePath of files) {
    let source;
    try {
      source = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    const pr = parseFile(source, filePath);
    if (!pr) continue;
    parsed.push({ path: pr.path, source: pr.source, ast: pr.ast });
    const fileRoutes = extractRoutesFromFile(pr.path, pr.source, pr.ast);
    routes.push(...fileRoutes);
  }

  return { routes, files: parsed };
}
