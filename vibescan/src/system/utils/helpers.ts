// Shared AST helpers used by attack detection rules.

import type { CallExpression, Node, MemberExpression } from "estree";

export function getCalleeName(node: CallExpression): string | null {
  const callee = node.callee;
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    const obj = callee.object;
    if (obj.type === "Identifier") return `${obj.name}.${callee.property.name}`;
    if (
      obj.type === "MemberExpression" &&
      obj.property.type === "Identifier" &&
      obj.object.type === "Identifier"
    ) {
      return `${obj.object.name}.${obj.property.name}.${callee.property.name}`;
    }
  }
  return null;
}

/** Rightmost method name for chained calls, e.g. `db.User.findAll` → `findAll`. */
export function getCallMethodName(node: CallExpression): string | null {
  const c = node.callee;
  if (c.type === "MemberExpression" && c.property.type === "Identifier") return c.property.name;
  return null;
}

export function parseCalleeParts(fullName: string): { obj: string | null; method: string | null } {
  const parts = fullName.split(".");
  const method = parts.length > 0 ? parts[parts.length - 1] : null;
  const obj = parts.length > 1 ? parts[0] : null;
  return { obj, method };
}

export function getStringValue(node: Node): string | null {
  if (node.type === "Literal" && typeof node.value === "string") return node.value.toLowerCase();
  if (
    node.type === "TemplateLiteral" &&
    node.quasis.length === 1 &&
    !node.quasis[0].value.raw.includes("${")
  ) {
    return node.quasis[0].value.raw.toLowerCase();
  }
  return null;
}

export function isFixedOrZeroIV(node: Node): boolean {
  if (node.type === "Literal" && typeof node.value === "string") {
    const s = node.value;
    if (s.length <= 32 && /^0+$/.test(s.replace(/\s/g, ""))) return true;
    if (s.length >= 8 && s.length <= 64 && !/[a-zA-Z]/.test(s)) return true;
  }
  if (node.type === "CallExpression") {
    const name = getCalleeName(node);
    if (name === "Buffer.alloc" || name === "Buffer.from") {
      const arg = node.arguments[0];
      if (arg?.type === "Literal" && (arg.value === 0 || arg.value === "0")) return true;
      if (
        arg?.type === "Literal" &&
        typeof arg.value === "string" &&
        /^0*$/.test(arg.value)
      )
        return true;
    }
  }
  return false;
}

/** Roots treated as server HTTP request objects (Express `req`, Next.js `NextRequest` parameter `request`, etc.). */
const HTTP_REQUEST_ROOT_IDS = new Set(["req", "request"]);

/** Callee is `request.x.y()` / `req.query.foo()` style chain rooted at an HTTP request object. */
function calleeChainRootsAtHttpRequest(callee: Node): boolean {
  if (callee.type === "MemberExpression") {
    let cur: Node = callee;
    while (cur.type === "MemberExpression") {
      const m = cur as MemberExpression;
      if (m.object.type === "Identifier" && HTTP_REQUEST_ROOT_IDS.has(m.object.name)) return true;
      cur = m.object;
    }
  }
  return false;
}

/** True if expression reads from `req` / `request` (cookies, body, query, params, headers, nextUrl, …). */
export function referencesReq(node: Node | null | undefined): boolean {
  if (!node) return false;
  if (node.type === "MemberExpression") {
    let cur: Node = node;
    while (cur.type === "MemberExpression") {
      const m = cur as MemberExpression;
      if (m.object.type === "Identifier" && HTTP_REQUEST_ROOT_IDS.has(m.object.name)) return true;
      cur = m.object;
    }
    return false;
  }
  if (node.type === "BinaryExpression") {
    return referencesReq(node.left) || referencesReq(node.right);
  }
  if (node.type === "LogicalExpression") {
    return referencesReq(node.left) || referencesReq(node.right);
  }
  if (node.type === "ConditionalExpression") {
    return referencesReq(node.test) || referencesReq(node.consequent) || referencesReq(node.alternate);
  }
  if (node.type === "TemplateLiteral") {
    return node.expressions.some((e) => referencesReq(e));
  }
  if (node.type === "CallExpression") {
    if (calleeChainRootsAtHttpRequest(node.callee as Node)) return true;
    return node.arguments.some((a) => referencesReq(a as Node));
  }
  if (node.type === "ArrayExpression") {
    return node.elements.some((e) => e != null && referencesReq(e));
  }
  if (node.type === "ObjectExpression") {
    return node.properties.some((p) => p.type === "Property" && referencesReq(p.value as Node));
  }
  return false;
}

export function isDynamicOrUserInput(node: Node): boolean {
  switch (node.type) {
    case "BinaryExpression":
      return (
        node.operator === "+" &&
        (isDynamicOrUserInput(node.left) || isDynamicOrUserInput(node.right))
      );
    case "TemplateLiteral":
      return node.expressions.length > 0;
    case "Identifier":
    case "CallExpression":
    case "MemberExpression":
      return true;
    default:
      return false;
  }
}
