import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode } from "../utils.js";
import { TIER1 } from "../../secrets/core-dict.js";
import { TIER2 } from "../../secrets/llm-dict.js";
import { shouldSkipHighEntropySecret } from "../../secrets/entropy.js";

const DICT = new Set([...TIER1, ...TIER2].map((s) => s.toLowerCase()));

function isProcessEnvAccess(node) {
  if (!t.isMemberExpression(node)) return false;
  if (t.isIdentifier(node.object, { name: "process" }) && t.isIdentifier(node.property, { name: "env" })) {
    return true;
  }
  return isProcessEnvAccess(node.object);
}

export const ruleSec002 = {
  id: "RULE-SEC-002",
  cwe: "CWE-547",
  owasp: "A02:2021",
  severity: "medium",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        LogicalExpression(path) {
          const { node } = path;
          if (node.operator !== "||" && node.operator !== "??") return;
          if (!isProcessEnvAccess(node.left)) return;
          if (!t.isStringLiteral(node.right)) return;
          const val = node.right.value;
          if (shouldSkipHighEntropySecret(val)) return;
          if (!DICT.has(val.toLowerCase())) return;
          out.push({
            ruleId: "RULE-SEC-002",
            message: "Environment variable fallback uses a weak/example secret string.",
            cwe: "CWE-547",
            owasp: "A02:2021",
            severity: "medium",
            file: filePath,
            line: nodeLine(node),
            snippet: snippetForNode(source, node),
          });
        },
      });
    });
    return out;
  },
};
