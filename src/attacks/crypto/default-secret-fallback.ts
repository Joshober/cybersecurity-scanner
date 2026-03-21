// Weak literal fallback: process.env.X || "known-weak" — only flags dictionary matches (see secretDict).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { ALL_SECRETS } from "./secretDict.js";
import { isLikelyRealSecret } from "./entropy.js";

export const defaultSecretFallbackRule: Rule = {
  id: "crypto.secrets.env-fallback",
  message: "Env var falls back to a known weak secret literal.",
  why: "If the app runs without the env var set, a guessable default may be used in production.",
  fix: "Do not fall back to weak defaults. Fail at startup if the env var is missing, or use a secrets manager.",
  cwe: 547,
  owasp: "A02:2021",
  severity: "error",
  category: "crypto",
  nodeTypes: ["LogicalExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "LogicalExpression" || node.operator !== "||") return;
    const left = node.left;
    let isProcessEnv = false;
    if (left.type === "MemberExpression") {
      if (
        left.object.type === "Identifier" &&
        left.object.name === "process" &&
        left.property.type === "Identifier" &&
        left.property.name === "env"
      ) {
        isProcessEnv = true;
      }
      if (
        left.object.type === "MemberExpression" &&
        left.object.object.type === "Identifier" &&
        left.object.object.name === "process" &&
        left.object.property.type === "Identifier" &&
        left.object.property.name === "env"
      ) {
        isProcessEnv = true;
      }
    }
    if (!isProcessEnv) return;
    const right = node.right;
    if (right.type !== "Literal" || typeof right.value !== "string" || right.value.length === 0) return;
    if (isLikelyRealSecret(right.value)) return;
    if (!ALL_SECRETS.has(right.value)) return;
    context.report(node, { findingKind: "ENV_FALLBACK", cwe: 547, owasp: "A02:2021" });
  },
};
