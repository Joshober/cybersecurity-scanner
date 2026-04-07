// Log injection: user input written to logs without sanitization. Mitigation: sanitize log input (filter CR/LF), limit log entry size.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import {
  describeCalleeName,
  getCalleeName,
  isDynamicOrUserInput,
  looksStringLikeType,
} from "../../system/utils/helpers.js";
import {
  getImportedLogSinkCallee,
  getLogSinkCallee,
  LOG_SINK_METHODS,
} from "../../system/sinks/index.js";

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
    const resolved = context.getResolvedCallee?.(node);
    const callee = describeCalleeName(resolved?.calleeName ?? getCalleeName(node));
    const method = resolved?.importSource && resolved?.symbolName ? resolved.symbolName : callee.methodName;
    if (!method) return;
    const sink =
      getLogSinkCallee(callee.objectName ?? "", method) ??
      getImportedLogSinkCallee(resolved?.importSource, method);
    const isBareLog = !callee.objectName && sink === null && LOG_SINK_METHODS.has(method);
    if (!sink && !isBareLog) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    const typeText = context.getTypeText?.(firstArg);
    if (!looksStringLikeType(typeText)) return;
    if (isDynamicOrUserInput(firstArg)) context.report(node);
  },
};
