import traverseModule from "@babel/traverse";
import * as t from "@babel/types";

export const traverse = traverseModule.default ?? traverseModule;

/**
 * @param {import('../types.js').ScanContext} ctx
 * @param {(f: import('../types.js').ParsedFile) => void} fn
 */
export function forEachParsedFile(ctx, fn) {
  for (const f of ctx.files) {
    fn(f);
  }
}

/**
 * @param {import('@babel/types').Node|null|undefined} node
 */
export function nodeLine(node) {
  return node?.loc?.start.line ?? 0;
}

/**
 * @param {string} source
 * @param {import('@babel/types').Node} node
 */
export function snippetForNode(source, node) {
  const line = nodeLine(node);
  if (!line) return "";
  return source.split("\n")[line - 1]?.trim() ?? "";
}

/**
 * @param {import('@babel/types').Node|null|undefined} node
 */
export function expressionUsesReq(node) {
  if (!node) return false;
  if (t.isIdentifier(node) && node.name === "req") return true;
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object) && node.object.name === "req") return true;
    return expressionUsesReq(node.object);
  }
  if (t.isTemplateLiteral(node)) {
    return node.expressions.some((e) => expressionUsesReq(e));
  }
  if (t.isBinaryExpression(node)) {
    return expressionUsesReq(node.left) || expressionUsesReq(node.right);
  }
  if (t.isCallExpression(node)) {
    const args = node.arguments.some(
      (a) => (t.isSpreadElement(a) ? false : expressionUsesReq(a))
    );
    return args || expressionUsesReq(node.callee);
  }
  if (t.isLogicalExpression(node)) {
    return expressionUsesReq(node.left) || expressionUsesReq(node.right);
  }
  if (t.isConditionalExpression(node)) {
    return (
      expressionUsesReq(node.test) ||
      expressionUsesReq(node.consequent) ||
      expressionUsesReq(node.alternate)
    );
  }
  if (t.isArrayExpression(node)) {
    return node.elements.some((el) => el != null && !t.isSpreadElement(el) && expressionUsesReq(el));
  }
  if (t.isObjectExpression(node)) {
    return node.properties.some((p) => {
      if (t.isObjectProperty(p) && t.isExpression(p.value)) return expressionUsesReq(p.value);
      if (t.isObjectMethod(p)) return false;
      return false;
    });
  }
  if (t.isSequenceExpression(node)) {
    return node.expressions.some((e) => expressionUsesReq(e));
  }
  if (t.isAssignmentExpression(node)) {
    return expressionUsesReq(node.right);
  }
  return false;
}

/**
 * @param {import('@babel/types').Expression} fnNode
 * @param {string[]} userRoots
 */
export function handlerReferencesUser(fnNode, userRoots = ["user"]) {
  let ok = false;
  const wrap = t.file(t.program([t.expressionStatement(fnNode)]));
  traverse(wrap, {
    MemberExpression(path) {
      const { node } = path;
      if (!t.isIdentifier(node.object, { name: "req" })) return;
      if (!t.isIdentifier(node.property)) return;
      if (userRoots.includes(node.property.name)) ok = true;
    },
  });
  return ok;
}

/**
 * @param {import('@babel/types').Expression} fnNode
 */
export function handlerCallsSanitizer(fnNode) {
  const names = new Set([
    "escapeHtml",
    "sanitize",
    "xss",
    "DOMPurify",
    "purify",
    "escape",
    "encodeURIComponent",
  ]);
  let ok = false;
  const wrap = t.file(t.program([t.expressionStatement(fnNode)]));
  traverse(wrap, {
    CallExpression(path) {
      const c = path.node.callee;
      if (t.isIdentifier(c) && names.has(c.name)) ok = true;
      if (t.isMemberExpression(c) && !c.computed && t.isIdentifier(c.property)) {
        if (names.has(c.property.name)) ok = true;
      }
    },
  });
  return ok;
}

const AUTH_MW = [
  "passport.authenticate",
  "verifyToken",
  "requireAuth",
  "isAuthenticated",
  "jwt.verify",
  "authMiddleware",
];

/**
 * @param {import('../types.js').RouteRecord} route
 */
export function routeHasAuthMiddleware(route) {
  const chain = route.middlewares.join(" ");
  return AUTH_MW.some((m) => chain.includes(m.split(".")[0]) || chain.includes(m));
}

/**
 * @param {import('../types.js').RouteRecord} route
 */
export function routeHasCsrfMiddleware(route) {
  const chain = route.middlewares.join(" ").toLowerCase();
  return (
    chain.includes("csrf") ||
    chain.includes("csurf") ||
    chain.includes("doublecsrf") ||
    chain.includes("lusca.csrf")
  );
}

/**
 * @param {import('../types.js').RouteRecord} route
 */
export function routeHasRateLimitMiddleware(route) {
  const c = route.middlewares.join(" ").toLowerCase();
  return (
    c.includes("ratelimit") ||
    c.includes("expressratelimit") ||
    c.includes("bottleneck") ||
    c.includes("slowdown")
  );
}

/**
 * @param {string} fullPath
 */
export function routeNeedsRateLimitHeuristic(fullPath) {
  const p = fullPath.toLowerCase();
  return (
    p.includes("/login") ||
    p.includes("/register") ||
    p.includes("/auth") ||
    p.includes("/token") ||
    p.startsWith("/api/")
  );
}
