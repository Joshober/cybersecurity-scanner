// XPath injection: unsanitized user input in XPath queries. Mitigation: parameterized queries or precompiled XPath; escape special chars.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts, isDynamicOrUserInput } from "../../system/utils/helpers.js";

const XPATH_METHODS = new Set([
  "evaluate",   // document.evaluate(expression, ...)
  "select",     // xpath.select(expression, doc)
  "select1",
  "evaluateWithContext",
]);

export const xpathInjectionRule: Rule = {
  id: "injection.xpath",
  message: "XPath query built from user input can lead to XPath injection.",
  why: "Unsanitized input in XPath allows attackers to bypass authentication or access data; XPath has no built-in access control.",
  fix: "Use parameterized queries or precompiled XPath expressions. If dynamic queries are unavoidable, escape special characters in user input.",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const method = parseCalleeParts(name).method;
    if (!method || !XPATH_METHODS.has(method)) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    if (isDynamicOrUserInput(firstArg)) context.report(node);
  },
};
