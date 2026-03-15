// Weak ciphers: DES, RC4, etc.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts, getStringValue } from "../../system/utils/helpers.js";

const WEAK_CIPHER_ALGOS = new Set(["des", "des-ede", "des-ede3", "des3", "rc4", "rc2", "bf", "blowfish", "cast", "idea"]);
const INSECURE_METHODS = new Set(["createCipher", "createDecipher", "createCipheriv", "createDecipheriv"]);

export const weakCiphersRule: Rule = {
  id: "crypto.cipher.weak",
  message: "Avoid weak cipher '{{algo}}'. Use AES in an authenticated mode.",
  why: "DES, RC4, and similar ciphers are weak or broken.",
  fix: "Use AES-GCM: crypto.createCipheriv('aes-256-gcm', key, iv) and handle the auth tag.",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name?.includes("createCipher") && !name?.includes("createDecipher")) return;
    const method = parseCalleeParts(name).method;
    if (!method || !INSECURE_METHODS.has(method)) return;
    const arg = node.arguments[0];
    if (!arg) return;
    const algo = getStringValue(arg);
    if (algo && WEAK_CIPHER_ALGOS.has(algo)) context.report(node, { algo });
  },
};
