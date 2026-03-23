import { TIER1_SECRETS } from "./secretDict.js";
import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";
import { ALL_SECRETS, isLikelyRealSecret } from "./secretDict.js";

/** Config for generated JWT weak-secret tests. */
export const JWT_WEAK_SECRET_TEST = {
  algorithm: "HS256" as const,
  testSecrets: [...TIER1_SECRETS],
  forgedPayload: { role: "admin", isAdmin: true } as Record<string, unknown>,
};

export const jwtWeakVerifySecretRule: Rule = {
  id: "crypto.jwt.weak-secret-verify",
  message: "JWT verify() uses a known weak secret literal.",
  why: "Weak JWT verification secrets can be guessed, allowing forged tokens to pass verification.",
  fix: "Load a high-entropy verification secret from secure configuration (vault/KMS/env), never dictionary literals.",
  remediation: "Replace weak verify secret with a long random key and rotate credentials.",
  cwe: 347,
  owasp: "A07:2021",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!(name === "jwt.verify" || name === "verify")) return;
    const secretArg = node.arguments[1];
    if (!secretArg || secretArg.type !== "Literal" || typeof secretArg.value !== "string") return;
    if (isLikelyRealSecret(secretArg.value)) return;
    if (!ALL_SECRETS.has(secretArg.value)) return;
    context.report(node, { cwe: 347, owasp: "A07:2021" });
  },
};
