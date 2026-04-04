// Untrusted deserialization (e.g. node-serialize unserialize on upload/request data).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";

export const insecureDeserializeRule: Rule = {
  id: "injection.deserialize.untrusted",
  message: "Deserializing untrusted data can lead to remote code execution.",
  why: "Functions like `unserialize` execute attacker-controlled object graphs. Never deserialize raw user uploads or request bodies without strict schema validation.",
  fix: "Use JSON.parse on a strict schema, avoid `node-serialize` / `serialize` on untrusted input, or use signed payloads with verified keys only.",
  severity: "error",
  category: "injection",
  cwe: 502,
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const lower = name.toLowerCase();
    if (!lower.includes("unserialize")) return;
    const arg0 = node.arguments[0];
    if (!arg0) return;
    if (arg0.type === "Literal" && typeof arg0.value === "string") return;
    context.report(node);
  },
};
