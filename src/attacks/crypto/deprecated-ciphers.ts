// Deprecated cipher APIs: createCipher / createDecipher.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName } from "../../system/utils/helpers.js";

export const deprecatedCiphersRule: Rule = {
  id: "crypto.cipher.deprecated",
  message: "crypto.createCipher/createDecipher are deprecated and insecure.",
  why: "Node documents these APIs as deprecated. They lack an explicit IV.",
  fix: "Use createCipheriv/createDecipheriv with a random IV.",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (name === "crypto.createCipher" || name === "createCipher" || name === "crypto.createDecipher" || name === "createDecipher") {
      context.report(node);
    }
  },
};
