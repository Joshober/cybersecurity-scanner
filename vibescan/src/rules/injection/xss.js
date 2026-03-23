import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq, handlerCallsSanitizer } from "../utils.js";

function isResSendCall(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  if (!t.isIdentifier(callee.property, { name: "send" })) return false;
  return t.isIdentifier(callee.object) && callee.object.name === "res";
}

export const ruleInj002 = {
  id: "RULE-INJ-002",
  cwe: "CWE-79",
  owasp: "A03:2021",
  severity: "high",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;
          if (!isResSendCall(callee)) return;
          const arg = args[0];
          if (!arg) return;
          if (!expressionUsesReq(arg) && !t.isTemplateLiteral(arg)) return;
          if (t.isTemplateLiteral(arg) && !arg.expressions.some((e) => expressionUsesReq(e))) return;

          const fn = path.getFunctionParent()?.node;
          if (fn && (t.isArrowFunctionExpression(fn) || t.isFunctionExpression(fn))) {
            if (handlerCallsSanitizer(fn)) return;
          }

          out.push({
            ruleId: "RULE-INJ-002",
            message: "Possible reflected XSS: res.send() may echo user-controlled input without sanitization.",
            cwe: "CWE-79",
            owasp: "A03:2021",
            severity: "high",
            file: filePath,
            line: nodeLine(path.node),
            snippet: snippetForNode(source, path.node),
          });
        },
        AssignmentExpression(path) {
          const { left, right } = path.node;
          if (!t.isMemberExpression(left) || left.computed) return;
          if (!t.isIdentifier(left.property, { name: "innerHTML" })) return;
          if (!expressionUsesReq(right) && !t.isTemplateLiteral(right)) return;
          if (t.isTemplateLiteral(right) && !right.expressions.some((e) => expressionUsesReq(e))) return;
          out.push({
            ruleId: "RULE-INJ-002",
            message: "Possible DOM XSS: innerHTML assigned from user-influenced data.",
            cwe: "CWE-79",
            owasp: "A03:2021",
            severity: "high",
            file: filePath,
            line: nodeLine(path.node),
            snippet: snippetForNode(source, path.node),
          });
        },
      });
    });
    return out;
  },
};
