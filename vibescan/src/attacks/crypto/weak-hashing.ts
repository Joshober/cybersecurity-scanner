// Weak hashing: MD5, SHA-1 in security-sensitive contexts. Use bcrypt, scrypt, PBKDF2, or argon2 for passwords; SHA-256+ for general hashing.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, getStringValue } from "../../system/utils/helpers.js";

const WEAK_HASH_ALGOS = new Set([
  "md5", "md4", "sha1", "sha", "ripemd", "RSA-MD5", "RSA-SHA1",
]);

export const weakHashingRule: Rule = {
  id: "crypto.hash.weak",
  message: "Avoid weak hash algorithm '{{algo}}'. For password storage use a password hashing function; for general hashing use SHA-256+.",
  why: "MD5 and SHA-1 are cryptographically broken. If this hashes passwords, they are vulnerable to brute-force. For integrity/signatures use SHA-256 or SHA-3.",
  fix: "For passwords: use bcrypt, scrypt, PBKDF2, or argon2 with salting (e.g. bcrypt.hashSync(password, 10)). For general hashing: crypto.createHash('sha256') or crypto.createHash('sha512').",
  severity: "error",
  category: "crypto",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (name === "md5" || name === "MD5") {
      context.report(node, { algo: "md5" });
      return;
    }
    if (name !== "crypto.createHash" && name !== "createHash") return;
    const arg = node.arguments[0];
    if (!arg) return;
    const algo = getStringValue(arg);
    if (algo && WEAK_HASH_ALGOS.has(algo)) context.report(node, { algo });
  },
};
