// SQL injection: user input concatenated into SQL. Taint engine reports injection.sql.tainted-flow when tainted data reaches db.query.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts } from "../../system/utils/helpers.js";

const QUERY_METHODS = new Set(["query", "execute", "exec", "run", "raw", "queryRaw", "executeRaw", "find", "findOne", "findMany", "aggregate", "where", "select"]);

export const sqlInjectionRule: Rule = {
  id: "injection.sql.string-concat",
  message: "SQL built with string concatenation or template literals can lead to SQL injection.",
  why: "Untrusted input concatenated into a SQL string can break out of the query and execute arbitrary SQL.",
  fix: "Use parameterized queries, e.g. db.query('SELECT * FROM users WHERE id = ?', [id]), or an ORM with parameter binding.",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const method = parseCalleeParts(name).method;
    if (!method || !QUERY_METHODS.has(method)) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) context.report(node);
    if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") context.report(node);
  },
};
