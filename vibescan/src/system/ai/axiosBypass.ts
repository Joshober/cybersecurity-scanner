// RULE-SSRF-002 — axios baseURL + user-controlled relative url (CVE-2024-39338 class).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../utils/rule-types.js";
import { getCalleeName } from "../utils/helpers.js";

function objectHasBaseUrlAndTaintedUrl(obj: import("estree").ObjectExpression): boolean {
  let hasBase = false;
  let taintedUrl = false;
  for (const p of obj.properties) {
    if (p.type !== "Property") continue;
    const k = p.key;
    const key =
      k.type === "Identifier" ? k.name : k.type === "Literal" && typeof k.value === "string" ? k.value : null;
    if (key === "baseURL") {
      if (p.value.type === "Literal" && typeof p.value.value === "string") hasBase = true;
    }
    if (key === "url") {
      const v = p.value;
      if (v.type === "MemberExpression") {
        const o = v.object;
        if (o.type === "Identifier" && (o.name === "req" || o.name === "request")) taintedUrl = true;
        if (
          o.type === "MemberExpression" &&
          o.object.type === "Identifier" &&
          (o.object.name === "req" || o.object.name === "request")
        )
          taintedUrl = true;
      }
    }
  }
  return hasBase && taintedUrl;
}

export const axiosBypassRule: Rule = {
  id: "RULE-SSRF-002",
  message: "axios config mixes baseURL with user-controlled url — SSRF/bypass risk.",
  why: "Relative or protocol-relative user URLs can escape the intended origin (axios CVE class).",
  fix: "Validate and resolve URLs against an allowlist; avoid passing raw user input to url when using baseURL.",
  cwe: 918,
  owasp: "A10:2021",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const resolved = context.getResolvedCallee?.(node);
    const name = resolved?.calleeName ?? getCalleeName(node);
    const isAxiosCall = name === "axios" || resolved?.importSource === "axios";
    if (!isAxiosCall) return;
    const arg0 = node.arguments[0];
    if (!arg0 || arg0.type !== "ObjectExpression") return;
    if (objectHasBaseUrlAndTaintedUrl(arg0)) {
      context.report(node, {
        cveRef: ["CVE-2024-39338", "CVE-2025-27152"],
        cwe: 918,
        owasp: "A10:2021",
      });
    }
  },
};
