// Code injection: eval(), Function(), setTimeout(string). User input must not reach dynamic execution. Avoid in production.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";

const DANGEROUS_GLOBALS = new Set(["eval", "Function", "setTimeout", "setInterval"]);

function getNewExpressionCalleeName(node: import("estree").NewExpression): string | null {
  const callee = node.callee;
  if (callee.type === "Identifier") return callee.name;
  return null;
}

export const codeInjectionRule: Rule = {
  id: "injection.eval",
  message: "eval() and similar enable code injection from untrusted input.",
  why: "Dynamic code execution from a string allows an attacker to run arbitrary code if the string is user-controlled or derived from user input.",
  fix: "Use JSON.parse() for data, or a safe data structure. Do not pass user input or concatenated strings into eval, Function(), or setTimeout(string).",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression", "NewExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type === "CallExpression") {
      const name = getCalleeName(node);
      if (name && DANGEROUS_GLOBALS.has(name)) context.report(node);
      return;
    }
    if (node.type === "NewExpression") {
      const name = getNewExpressionCalleeName(node);
      if (name === "Function") context.report(node);
    }
  },
};
