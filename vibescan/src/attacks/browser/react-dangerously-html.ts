// React: dangerouslySetInnerHTML with non-static __html (object form or JSX).

import type { Expression, Node, ObjectExpression, Property } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { isDynamicOrUserInput } from "../../system/utils/helpers.js";

function propertyKeyName(key: Property["key"]): string | null {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
}

function findHtmlExpressionFromInnerObject(obj: ObjectExpression): Expression | null {
  for (const p of obj.properties) {
    if (p.type !== "Property" || p.computed) continue;
    const n = propertyKeyName(p.key);
    if (n !== "__html") continue;
    const v = p.value;
    if (v.type === "ObjectExpression" || v.type === "ArrayExpression") return null;
    if (v.type === "FunctionExpression" || v.type === "ArrowFunctionExpression") return null;
    return v as Expression;
  }
  return null;
}

function findHtmlValueFromDangerousProp(value: Property["value"]): Expression | null {
  if (value.type !== "ObjectExpression") return null;
  return findHtmlExpressionFromInnerObject(value);
}

/** JSX nodes are emitted only when parsing JSX; typed loosely for ESTree compatibility. */
function asJsxAttribute(node: Node): {
  name: { type: string; name?: string };
  value: { type: string; expression?: Expression | { type: string } } | null;
} | null {
  const t = (node as { type?: string }).type;
  if (t !== "JSXAttribute") return null;
  return node as unknown as {
    name: { type: string; name?: string };
    value: { type: string; expression?: Expression | { type: string } } | null;
  };
}

export const reactDangerouslyInnerHtmlRule: Rule = {
  id: "injection.xss.react-dangerously-set-inner-html",
  message:
    "dangerouslySetInnerHTML with non-literal HTML can cause XSS if the string is user-influenced.",
  why: "React skips escaping for __html; any attacker-controlled markup becomes executable in the page context.",
  fix: "Avoid raw HTML; use sanitized markup from a trusted pipeline or framework-safe components.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["Property", "JSXAttribute"],
  check(context: RuleContext, node: Node) {
    if (node.type === "Property") {
      if (node.computed) return;
      const key = propertyKeyName(node.key);
      if (key !== "dangerouslySetInnerHTML") return;
      const inner = findHtmlValueFromDangerousProp(node.value);
      if (inner && isDynamicOrUserInput(inner)) context.report(node);
      return;
    }
    const jsx = asJsxAttribute(node);
    if (!jsx) return;
    if (jsx.name.type !== "JSXIdentifier" || jsx.name.name !== "dangerouslySetInnerHTML") return;
    const val = jsx.value;
    if (!val || val.type !== "JSXExpressionContainer") return;
    const expr = val.expression;
    if (!expr || (expr as { type: string }).type === "JSXEmptyExpression") return;
    const inner = findHtmlValueFromDangerousProp(expr as Property["value"]);
    if (inner && isDynamicOrUserInput(inner)) context.report(node);
  },
};
