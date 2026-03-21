// SSRF sinks: outbound HTTP client calls; tainted URL argument is high risk.

import type { CallExpression } from "estree";

const HTTP_CLIENT_OBJECTS = new Set(["http", "https", "axios", "got", "needle"]);

/** Returns sink label and index of URL-like first argument, or null. */
export function getSsrSinkInfo(
  calleeName: string,
  objName: string,
  methodName: string
): { label: string; argIndex: number } | null {
  if (calleeName === "fetch") return { label: "fetch", argIndex: 0 };
  if (objName === "http" || objName === "https") {
    if (methodName === "get" || methodName === "request") return { label: `${objName}.${methodName}`, argIndex: 0 };
  }
  if (objName === "axios" && ["get", "post", "put", "patch", "delete", "head", "options"].includes(methodName)) {
    return { label: `axios.${methodName}`, argIndex: 0 };
  }
  if (HTTP_CLIENT_OBJECTS.has(objName) && methodName === "request") {
    return { label: `${objName}.request`, argIndex: 0 };
  }
  return null;
}

/** True if call is axios(...) with single options object (URL inside object). */
export function isAxiosCallExpression(node: CallExpression): boolean {
  const c = node.callee;
  return c.type === "Identifier" && c.name === "axios";
}
