// Open redirect: redirect URL taken from request without validation.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, referencesReq } from "../../system/utils/helpers.js";

function isRedirectCall(name: string | null): boolean {
  if (!name) return false;
  return name === "res.redirect" || name.endsWith(".redirect");
}

export const openRedirectRule: Rule = {
  id: "injection.open-redirect",
  message: "Redirect target may be controlled by the user (open redirect / phishing risk).",
  why: "Passing request data into redirect APIs (Express res.redirect, Next.js NextResponse.redirect / Response.redirect, etc.) without an allow-list lets attackers send victims to malicious sites.",
  fix: "Validate redirect targets against a fixed allow-list or use relative paths only. Reject absolute URLs from untrusted input.",
  severity: "warning",
  category: "injection",
  cwe: 601,
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!isRedirectCall(name)) return;
    const arg0 = node.arguments[0];
    if (!arg0) return;
    if (referencesReq(arg0)) context.report(node);
  },
};
