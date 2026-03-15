// Hardcoded secrets: API keys, passwords, JWT secrets in source. Load from environment or a secrets manager.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";

export const hardcodedSecretsRule: Rule = {
  id: "crypto.secrets.hardcoded",
  message: "Possible hardcoded secret in source.",
  why: "Secrets in code get committed to version control and can be leaked. They should not live in source.",
  fix: "Use environment variables (process.env.SECRET_KEY) or a secrets manager. Never commit real secrets.",
  severity: "warning",
  category: "crypto",
  nodeTypes: ["Property"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "Property" || node.key.type !== "Identifier") return;
    const key = node.key.name.toLowerCase();
    const isSecretLike =
      key.includes("secret") || key.includes("password") || key === "apikey" ||
      key === "api_key" || key.includes("jwt") || key === "privatekey";
    if (!isSecretLike) return;
    if (node.value.type === "Literal" && typeof node.value.value === "string" && node.value.value.length > 8) {
      context.report(node.value);
    }
  },
};
