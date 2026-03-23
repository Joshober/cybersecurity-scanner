import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode } from "../utils.js";

function isCorsCall(callee) {
  return t.isIdentifier(callee, { name: "cors" });
}

function originIsWildcardOrTrue(node) {
  if (!t.isObjectExpression(node)) return false;
  for (const p of node.properties) {
    if (!t.isObjectProperty(p) || p.computed) continue;
    const k = p.key;
    if (!t.isIdentifier(k, { name: "origin" }) && !t.isStringLiteral(k, { value: "origin" })) continue;
    const v = p.value;
    if (t.isStringLiteral(v) && v.value === "*") return true;
    if (t.isBooleanLiteral(v) && v.value === true) return true;
  }
  return false;
}

export const ruleMw004 = {
  id: "RULE-MW-004",
  cwe: "CWE-942",
  owasp: "A05:2021",
  severity: "medium",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;
          if (isCorsCall(callee) && args[0] && originIsWildcardOrTrue(args[0])) {
            out.push({
              ruleId: "RULE-MW-004",
              message: "CORS origin set to '*' or true — may be overly permissive.",
              cwe: "CWE-942",
              owasp: "A05:2021",
              severity: "medium",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
          }
          if (t.isMemberExpression(callee) && !callee.computed) {
            if (t.isIdentifier(callee.object, { name: "res" }) && t.isIdentifier(callee.property, { name: "header" })) {
              const nameArg = args[0];
              const valArg = args[1];
              if (
                t.isStringLiteral(nameArg) &&
                nameArg.value === "Access-Control-Allow-Origin" &&
                t.isStringLiteral(valArg) &&
                valArg.value === "*"
              ) {
                out.push({
                  ruleId: "RULE-MW-004",
                  message: "Access-Control-Allow-Origin set to '*'.",
                  cwe: "CWE-942",
                  owasp: "A05:2021",
                  severity: "medium",
                  file: filePath,
                  line: nodeLine(path.node),
                  snippet: snippetForNode(source, path.node),
                });
              }
            }
          }
        },
      });
    });
    return out;
  },
};
