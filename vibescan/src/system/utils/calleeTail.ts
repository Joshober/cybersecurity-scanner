// Last segment of a call callee (method or function name) for framework-specific rules.

import type { CallExpression } from "estree";
import { getCalleeTailIdentifier } from "./helpers.js";
export { getCalleeTailIdentifier } from "./helpers.js";

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
