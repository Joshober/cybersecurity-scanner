import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

function calleeEndsWith(name, callee) {
  if (t.isMemberExpression(callee) && !callee.computed && t.isIdentifier(callee.property, { name })) {
    return true;
  }
  return false;
}

export const ruleProto001 = {
  id: "RULE-PROTO-001",
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

          if (t.isCallExpression(callee)) {
            const innerCallee = callee.callee;
            if (t.isIdentifier(innerCallee, { name: "require" })) {
              const mod = callee.arguments[0];
              if (t.isStringLiteral(mod) && mod.value === "express-fileupload") {
                const opts = args[0];
                if (t.isObjectExpression(opts)) {
                  const parseNested = opts.properties.some(
                    (p) =>
                      t.isObjectProperty(p) &&
                      !p.computed &&
                      t.isIdentifier(p.key, { name: "parseNested" }) &&
                      t.isBooleanLiteral(p.value, { value: true })
                  );
                  if (parseNested) {
                    out.push({
                      ruleId: "RULE-PROTO-001",
                      message: "express-fileupload with parseNested: true (CVE-2020-7699 class risk).",
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
            }
          }

          const riskyLodash =
            (calleeEndsWith("merge", callee) ||
              calleeEndsWith("mergeWith", callee) ||
              calleeEndsWith("defaultsDeep", callee)) &&
            args.some((a) => !t.isSpreadElement(a) && expressionUsesReq(a));
          const deepmerge =
            t.isIdentifier(callee, { name: "deepmerge" }) &&
            args.some((a) => !t.isSpreadElement(a) && expressionUsesReq(a));
          if (riskyLodash || deepmerge) {
            out.push({
              ruleId: "RULE-PROTO-001",
              message: "Deep merge with user-controlled object may allow prototype pollution.",
              cwe: "CWE-1321",
              owasp: "A08:2021",
              severity: "high",
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
