// Disabled TLS: rejectUnauthorized false turns off certificate verification and enables MITM. Keep verification enabled in production.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";

export const disabledTlsRule: Rule = {
  id: "crypto.tls.reject-unauthorized",
  message: "Disabling TLS certificate verification (rejectUnauthorized: false) allows man-in-the-middle attacks.",
  why: "With verification disabled, an attacker can intercept and modify traffic. Only use for local debugging, never in production.",
  fix: "Remove rejectUnauthorized: false. Use proper CA certificates and fix certificate issues instead of disabling verification.",
  severity: "error",
  category: "crypto",
  nodeTypes: ["Property"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "Property" || node.key.type !== "Identifier") return;
    if (node.key.name !== "rejectUnauthorized") return;
    if (node.value.type === "Literal" && node.value.value === false) {
      context.report(node.value);
    }
  },
};
