// Fixed IV/nonce: reusing or all-zero IV breaks confidentiality. Generate a random IV per encryption (e.g. crypto.randomBytes(16)).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, isFixedOrZeroIV } from "../../system/utils/helpers.js";

export const fixedIvRule: Rule = {
  id: "crypto.cipher.fixed-iv",
  message: "IV or nonce appears to be fixed or all-zero. Reusing IVs with the same key breaks confidentiality.",
  why: "A fixed or predictable IV with the same key can leak plaintext. Each encryption must use a new random IV/nonce.",
  fix: "Generate a random IV per encryption: const iv = crypto.randomBytes(16); and pass it to createCipheriv. Never reuse the same IV with the same key.",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (name !== "crypto.createCipheriv" && name !== "createCipheriv") return;
    const ivArg = node.arguments[2];
    if (ivArg && isFixedOrZeroIV(ivArg)) context.report(node);
  },
};
