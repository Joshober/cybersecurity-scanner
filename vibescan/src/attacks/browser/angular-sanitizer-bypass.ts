// Angular: DomSanitizer bypass methods with non-literal (user-influenced) arguments.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { isDynamicOrUserInput } from "../../system/utils/helpers.js";
import { isAngularDomSanitizerBypassCall } from "../../system/utils/calleeTail.js";

export const angularSanitizerBypassRule: Rule = {
  id: "injection.xss.angular-sanitizer-bypass",
  message:
    "DomSanitizer bypass with dynamic content can lead to XSS if the value is user-controlled.",
  why: "bypassSecurityTrust* tells Angular to skip sanitization; attacker-controlled strings become executable in the DOM.",
  fix: "Do not pass user input into bypass methods; sanitize with a trusted library or avoid HTML injection.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    if (!isAngularDomSanitizerBypassCall(node)) return;
    const arg0 = node.arguments[0];
    if (!arg0 || arg0.type === "SpreadElement") return;
    if (isDynamicOrUserInput(arg0)) context.report(node);
  },
};
