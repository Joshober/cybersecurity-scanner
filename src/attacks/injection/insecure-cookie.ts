import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";
import { isResCookieCall, getResCookieOptionsArg } from "../../system/sinks/jwtCookie.js";

function objectHasTrueProp(
  node: import("estree").ObjectExpression,
  name: string
): boolean {
  for (const p of node.properties) {
    if (p.type !== "Property") continue;
    const k = p.key;
    const keyName =
      k.type === "Identifier" ? k.name : k.type === "Literal" && typeof k.value === "string" ? k.value : null;
    if (keyName !== name) continue;
    if (p.value.type === "Literal" && p.value.value === true) return true;
  }
  return false;
}

export const insecureCookieRule: Rule = {
  id: "mw.cookie.missing-flags",
  message: "res.cookie called without httpOnly and/or secure in options.",
  why: "Cookies without httpOnly are readable by script (XSS); without secure they leak over HTTP.",
  fix: "Pass { httpOnly: true, secure: true, sameSite: 'strict' } (or 'lax') in production.",
  cwe: 614,
  owasp: "A05:2021",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name || !isResCookieCall(name)) return;
    const opts = getResCookieOptionsArg(node);
    if (!opts) {
      context.report(node, { cwe: 614, owasp: "A05:2021" });
      return;
    }
    if (opts.type !== "ObjectExpression") return;
    const httpOnly = objectHasTrueProp(opts, "httpOnly");
    const secure = objectHasTrueProp(opts, "secure");
    if (!httpOnly || !secure) context.report(node, { cwe: 614, owasp: "A05:2021" });
  },
};
