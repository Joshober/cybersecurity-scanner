import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

export const ruleProto002 = {
  id: "RULE-PROTO-002",
  cwe: "CWE-1321",
  owasp: "A08:2021",
  severity: "high",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;
          if (t.isMemberExpression(callee) && !callee.computed) {
            const prop = callee.property;
            if (t.isIdentifier(prop, { name: "set" })) {
              const pathArg = args[1];
              if (pathArg && expressionUsesReq(pathArg)) {
                out.push({
                  ruleId: "RULE-PROTO-002",
                  message: "_.set / lodash-style set with user-controlled path argument.",
                  cwe: "CWE-1321",
                  owasp: "A08:2021",
                  severity: "high",
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
