// Command injection: user input in shell commands.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { describeCalleeName, getCalleeName } from "../../system/utils/helpers.js";
import {
  getCommandSinkCallee,
  getImportedCommandSinkCallee,
} from "../../system/sinks/index.js";

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
    const resolved = context.getResolvedCallee?.(node);
    const callee = describeCalleeName(resolved?.calleeName ?? getCalleeName(node));
    const method = resolved?.importSource && resolved?.symbolName ? resolved.symbolName : callee.methodName;
    if (!method) return;
    const sink =
      getCommandSinkCallee(callee.objectName ?? "", method) ??
      getImportedCommandSinkCallee(resolved?.importSource, method);
    if (!sink) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) context.report(node);
    if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") context.report(node);
  },
};
