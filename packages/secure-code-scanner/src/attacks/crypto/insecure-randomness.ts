// Insecure randomness: Math.random() for tokens, session IDs, keys. Use crypto.randomBytes() for security-sensitive values.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";

export const insecureRandomnessRule: Rule = {
  id: "crypto.random.insecure",
  message: "Math.random() must not be used for security-sensitive values (tokens, keys, nonces, salts).",
  why: "Math.random() is not cryptographically secure. Predictable values can be guessed and lead to token forgery or key recovery.",
  fix: "Use crypto.randomBytes(n) or crypto.getRandomValues() for tokens, keys, IVs, nonces, and salts.",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (name !== "Math.random") return;
    context.report(node);
  },
};
