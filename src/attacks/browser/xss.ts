// XSS: unsanitized user input into innerHTML or document.write.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, isDynamicOrUserInput } from "../../system/utils/helpers.js";

export const xssRule: Rule = {
  id: "injection.xss",
  message: "Unsanitized HTML insertion can lead to XSS.",
  why: "Inserting user-controlled or dynamic content into innerHTML, outerHTML, or document.write allows script injection.",
  fix: "Use textContent for plain text, or a sanitizer library for HTML. Set HttpOnly on session cookies. Avoid innerHTML with user input.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["AssignmentExpression", "CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "AssignmentExpression" && node.type !== "CallExpression") return;
    if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
      const prop = node.left.property;
      if (prop.type === "Identifier" && (prop.name === "innerHTML" || prop.name === "outerHTML" || prop.name === "insertAdjacentHTML")) {
        if (node.right.type !== "Literal" || isDynamicOrUserInput(node.right)) context.report(node);
      }
    }
    if (node.type === "CallExpression") {
      const name = getCalleeName(node);
      if (name === "document.write" || name === "document.writeln") context.report(node);
    }
  },
};
