import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode } from "../utils.js";

function objectHasTrueProp(obj, name) {
  if (!t.isObjectExpression(obj)) return false;
  return obj.properties.some((p) => {
    if (!t.isObjectProperty(p) || p.computed) return false;
    const k = p.key;
    if (!t.isIdentifier(k, { name }) && !t.isStringLiteral(k, { value: name })) return false;
    return t.isBooleanLiteral(p.value, { value: true });
  });
}

export const ruleAuth004 = {
  id: "RULE-AUTH-004",
  cwe: "CWE-614",
  owasp: "A05:2021",
  severity: "medium",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;

          if (t.isIdentifier(callee, { name: "session" })) {
            const cfg = args[0];
            if (t.isObjectExpression(cfg)) {
              let cookieNode = null;
              for (const p of cfg.properties) {
                if (!t.isObjectProperty(p) || p.computed) continue;
                const k = p.key;
                if (t.isIdentifier(k, { name: "cookie" }) && t.isObjectExpression(p.value)) {
                  cookieNode = p.value;
                  break;
                }
              }
              if (cookieNode && !objectHasTrueProp(cookieNode, "secure")) {
                out.push({
                  ruleId: "RULE-AUTH-004",
                  message: "express-session cookie config missing secure: true.",
                  cwe: "CWE-614",
                  owasp: "A05:2021",
                  severity: "medium",
                  file: filePath,
                  line: nodeLine(path.node),
                  snippet: snippetForNode(source, path.node),
                });
              }
            }
            return;
          }

          if (!t.isMemberExpression(callee) || callee.computed) return;
          if (!t.isIdentifier(callee.object, { name: "res" })) return;
          if (!t.isIdentifier(callee.property, { name: "cookie" })) return;
          const opts = args[2];
          if (!opts || !t.isObjectExpression(opts)) {
            out.push({
              ruleId: "RULE-AUTH-004",
              message: "res.cookie without options object — httpOnly/secure may be missing.",
              cwe: "CWE-614",
              owasp: "A05:2021",
              severity: "medium",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
            return;
          }
          if (!objectHasTrueProp(opts, "httpOnly")) {
            out.push({
              ruleId: "RULE-AUTH-004",
              message: "res.cookie options missing httpOnly: true.",
              cwe: "CWE-614",
              owasp: "A05:2021",
              severity: "medium",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
          }
          if (!objectHasTrueProp(opts, "secure")) {
            out.push({
              ruleId: "RULE-AUTH-004",
              message: "res.cookie options missing secure: true.",
              cwe: "CWE-614",
              owasp: "A05:2021",
              severity: "low",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
          }
        },
      });
    });
    return out;
  },
};
