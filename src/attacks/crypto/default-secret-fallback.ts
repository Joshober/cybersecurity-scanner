// Default secret fallback: process.env.X || "default" when env is missing. Fail at startup when key is missing; no silent substitution.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";

export const defaultSecretFallbackRule: Rule = {
  id: "crypto.secrets.env-fallback",
  message: "Fallback default secret when env var is unset is insecure.",
  why: "If the app runs without the env var set, the default (e.g. 'devsecret') may be used in production.",
  fix: "Do not fall back to a default secret. Fail at startup if the env var is missing, or use a secrets manager.",
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
    if (
      right.type === "Literal" &&
      ((typeof right.value === "string" && right.value.length > 0) || typeof right.value === "number")
    ) {
      context.report(node);
    }
  },
};
