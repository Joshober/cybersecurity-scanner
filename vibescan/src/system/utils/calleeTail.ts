// Last segment of a call callee (method or function name) for framework-specific rules.

import type { CallExpression } from "estree";

/** For `a.b.c()`, returns `c`. For `foo()`, returns `foo`. */
export function getCalleeTailIdentifier(node: CallExpression): string | null {
  const c = node.callee;
  if (c.type === "Identifier") return c.name;
  if (c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier") {
    return c.property.name;
  }
  return null;
}

const ANGULAR_BYPASS_METHODS = new Set([
  "bypassSecurityTrustHtml",
  "bypassSecurityTrustScript",
  "bypassSecurityTrustStyle",
  "bypassSecurityTrustUrl",
  "bypassSecurityTrustResourceUrl",
]);

export function isAngularDomSanitizerBypassCall(node: CallExpression): boolean {
  const tail = getCalleeTailIdentifier(node);
  return tail !== null && ANGULAR_BYPASS_METHODS.has(tail);
}
