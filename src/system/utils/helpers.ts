// Shared AST helpers used by attack detection rules.

import type { CallExpression, Node } from "estree";

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
