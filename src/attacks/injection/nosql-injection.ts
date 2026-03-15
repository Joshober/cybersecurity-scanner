// NoSQL injection: user input in $where/$expr changes query logic. Validate input; avoid building query objects from raw request data.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts } from "../../system/utils/helpers.js";

const NOSQL_METHODS = new Set(["find", "findOne", "findMany", "aggregate", "where", "findOneAndUpdate", "updateOne", "deleteOne"]);

export const nosqlInjectionRule: Rule = {
  id: "injection.noql",
  message: "NoSQL query built with $where/$expr from user input can lead to injection.",
  why: "$where and $expr execute JavaScript. If user input reaches these operators, an attacker can run arbitrary code.",
  fix: "Use parameterized queries or allow-listed operators. Do not pass user input into $where or $expr.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const method = parseCalleeParts(name).method;
    if (!method || !NOSQL_METHODS.has(method)) return;
    const firstArg = node.arguments[0];
    if (!firstArg || firstArg.type !== "ObjectExpression") return;
    const hasDollarWhere = firstArg.properties.some(
      (p: import("estree").ObjectExpression["properties"][0]) =>
        p.type === "Property" && p.key.type === "Identifier" && (p.key.name === "$where" || p.key.name === "$expr")
    );
    if (hasDollarWhere) context.report(node);
  },
};
