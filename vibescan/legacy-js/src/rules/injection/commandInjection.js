import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

function isExecLike(callee) {
  if (t.isIdentifier(callee)) {
    return callee.name === "exec" || callee.name === "execSync" || callee.name === "spawn";
  }
  if (t.isMemberExpression(callee) && !callee.computed) {
    const p = callee.property;
    if (t.isIdentifier(p) && (p.name === "exec" || p.name === "execSync" || p.name === "spawn")) return true;
  }
  return false;
}

export const ruleInj003 = {
  id: "RULE-INJ-003",
  cwe: "CWE-78",
  owasp: "A03:2021",
  severity: "critical",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;

          if (!isExecLike(callee)) return;
          if (args.some((a) => !t.isSpreadElement(a) && expressionUsesReq(a))) {
            out.push({
              ruleId: "RULE-INJ-003",
              message: "Possible command injection: exec/spawn/execSync with user-controlled arguments.",
              cwe: "CWE-78",
              owasp: "A03:2021",
              severity: "critical",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
            return;
          }
          if (t.isIdentifier(callee, { name: "spawn" }) && args.length >= 2) {
            const cmd = args[0];
            const arr = args[1];
            if (t.isStringLiteral(cmd) && cmd.value === "sh" && t.isArrayExpression(arr)) {
              const el0 = arr.elements[0];
              const el1 = arr.elements[1];
              if (
                t.isStringLiteral(el0) &&
                el0.value === "-c" &&
                el1 &&
                !t.isSpreadElement(el1) &&
                expressionUsesReq(el1)
              ) {
                out.push({
                  ruleId: "RULE-INJ-003",
                  message: "Possible command injection: spawn('sh', ['-c', userInput]).",
                  cwe: "CWE-78",
                  owasp: "A03:2021",
                  severity: "critical",
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
