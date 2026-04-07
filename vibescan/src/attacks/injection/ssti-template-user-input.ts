import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, referencesReq } from "../../system/utils/helpers.js";

export const sstiTemplateUserInputRule: Rule = {
  id: "injection.ssti.template-user-input",
  message: "User-controlled template/view input can lead to server-side template injection.",
  why: "Passing untrusted input into template rendering APIs can execute attacker-controlled template expressions on the server.",
  fix: "Never render templates selected directly from request data. Use a fixed allowlist of template names and treat template source as trusted-only.",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    const arg0 = node.arguments[0];
    if (!arg0 || arg0.type === "SpreadElement") return;

    const isResRender = name === "res.render" || name === "response.render";
    const isEjsRender = name === "ejs.render" || name.endsWith(".renderFile");
    if (!isResRender && !isEjsRender) return;

    if (referencesReq(arg0)) {
      context.report(node);
    }
  },
};
