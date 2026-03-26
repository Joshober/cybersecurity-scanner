// Command injection: user input in shell commands.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts } from "../../system/utils/helpers.js";

const SHELL_METHODS = new Set(["exec", "execSync", "spawn", "execFile", "execFileSync"]);

export const commandInjectionRule: Rule = {
  id: "injection.command",
  message: "Shell command built from string concatenation or template literals can lead to command injection.",
  why: "User-controlled input in a shell command string can escape and run arbitrary commands.",
  fix: "Use execFile with an array of arguments, or strictly sanitize input.",
  severity: "critical",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const { obj, method } = parseCalleeParts(name);
    if (!method || !SHELL_METHODS.has(method)) return;
    const ok = obj === "child_process" || obj === "cp" || obj === "childProcess" || obj === "require";
    if (!ok) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) context.report(node);
    if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") context.report(node);
  },
};
