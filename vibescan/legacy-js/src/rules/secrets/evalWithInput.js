import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

export const ruleSec003 = {
  id: "RULE-SEC-003",
  cwe: "CWE-95",
  owasp: "A03:2021",
  severity: "critical",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;
          if (t.isIdentifier(callee, { name: "eval" }) && args[0] && expressionUsesReq(args[0])) {
            out.push({
              ruleId: "RULE-SEC-003",
              message: "eval() with user-influenced input.",
              cwe: "CWE-95",
              owasp: "A03:2021",
              severity: "critical",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
            return;
          }
          if (t.isIdentifier(callee, { name: "setTimeout" }) && args[0] && expressionUsesReq(args[0])) {
            out.push({
              ruleId: "RULE-SEC-003",
              message: "setTimeout with user-controlled code argument (string/code injection).",
              cwe: "CWE-95",
              owasp: "A03:2021",
              severity: "critical",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
          }
        },
        NewExpression(path) {
          const { callee, arguments: args } = path.node;
          if (!t.isIdentifier(callee, { name: "Function" })) return;
          const body = args[args.length - 1];
          if (body && expressionUsesReq(body)) {
            out.push({
              ruleId: "RULE-SEC-003",
              message: "new Function() with user-influenced body.",
              cwe: "CWE-95",
              owasp: "A03:2021",
              severity: "critical",
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
