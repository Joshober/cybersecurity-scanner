// Log injection: user input written to logs without sanitization. Mitigation: sanitize log input (filter CR/LF), limit log entry size.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts, isDynamicOrUserInput } from "../../system/utils/helpers.js";

const LOG_METHODS = new Set([
  "log", "info", "warn", "error", "debug", "trace",
  "write", "child",  // Winston-style log methods.
]);

export const logInjectionRule: Rule = {
  id: "injection.log",
  message: "Log message built from user input without sanitization can lead to log injection.",
  why: "Unsanitized input in logs lets attackers insert fake entries, hide actions, or impersonate others via CR/LF and control characters.",
  fix: "Sanitize log input: strip or escape carriage return and line feed. Limit log entry size. Do not pass raw user input as the log message.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const { obj, method } = parseCalleeParts(name);
    if (!method || !LOG_METHODS.has(method)) return;
    const objLower = obj?.toLowerCase() ?? null;
    const isConsole = objLower === "console";
    const isLogger = objLower ? ["logger", "log", "winston", "pino", "bunyan"].includes(objLower) : false;
    const isBareLog = !obj && LOG_METHODS.has(method);
    if (!isConsole && !isLogger && !isBareLog) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    if (isDynamicOrUserInput(firstArg)) context.report(node);
  },
};
