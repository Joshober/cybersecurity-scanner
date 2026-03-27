import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";
import { ALL_SECRETS, isLikelyRealSecret } from "./secretDict.js";
import { isJwtSignCall, getJwtSignSecretArg } from "../../system/sinks/jwtCookie.js";

export const jwtWeakSecretRule: Rule = {
  id: "crypto.jwt.weak-secret-literal",
  message: "JWT signed with a known weak secret literal.",
  why: "Attackers who guess or know this secret can forge tokens.",
  fix: "Use a long random secret from a vault or env; never use dictionary/example strings.",
  remediation: "Replace with a high-entropy secret loaded only from secure configuration.",
  cwe: 347,
  owasp: "A07:2021",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name || !isJwtSignCall(name)) return;
    const secretArg = getJwtSignSecretArg(node);
    if (!secretArg || secretArg.type !== "Literal" || typeof secretArg.value !== "string") return;
    if (isLikelyRealSecret(secretArg.value)) return;
    if (!ALL_SECRETS.has(secretArg.value)) return;
    context.report(node, {
      cwe: 347,
      owasp: "A07:2021",
      proofHints: { weakJwtSecretLiteral: secretArg.value },
    });
  },
};
