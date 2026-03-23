import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

function isFsRead(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  if (!t.isIdentifier(callee.object, { name: "fs" })) return false;
  const p = callee.property;
  return t.isIdentifier(p) && (p.name === "readFile" || p.name === "readFileSync");
}

function isResSendFile(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  if (!t.isIdentifier(callee.object, { name: "res" })) return false;
  const p = callee.property;
  return t.isIdentifier(p) && p.name === "sendFile";
}

function isPathJoin(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  if (!t.isIdentifier(callee.object, { name: "path" })) return false;
  const p = callee.property;
  return t.isIdentifier(p) && p.name === "join";
}

function hasRootOption(arg) {
  if (!t.isObjectExpression(arg)) return false;
  return arg.properties.some(
    (p) =>
      t.isObjectProperty(p) &&
      t.isIdentifier(p.key, { name: "root" }) &&
      !p.computed
  );
}

export const ruleInj004 = {
  id: "RULE-INJ-004",
  cwe: "CWE-22",
  owasp: "A01:2021",
  severity: "high",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;

          if (isFsRead(callee)) {
            const target = args[0];
            if (target && expressionUsesReq(target)) {
              out.push({
                ruleId: "RULE-INJ-004",
                message: "Possible path traversal: fs.readFile/readFileSync with user-controlled path.",
                cwe: "CWE-22",
                owasp: "A01:2021",
                severity: "high",
                file: filePath,
                line: nodeLine(path.node),
                snippet: snippetForNode(source, path.node),
              });
            }
            return;
          }

          if (isResSendFile(callee)) {
            const fileArg = args[0];
            const opts = args[1];
            if (fileArg && expressionUsesReq(fileArg) && !hasRootOption(opts)) {
              out.push({
                ruleId: "RULE-INJ-004",
                message: "Possible path traversal: res.sendFile with user path and no root option.",
                cwe: "CWE-22",
                owasp: "A01:2021",
                severity: "high",
                file: filePath,
                line: nodeLine(path.node),
                snippet: snippetForNode(source, path.node),
              });
            }
            return;
          }

          if (isPathJoin(callee)) {
            const hasDirname = args.some(
              (a) =>
                t.isIdentifier(a, { name: "__dirname" }) ||
                (t.isMemberExpression(a) &&
                  t.isIdentifier(a.object, { name: "path" }) &&
                  t.isIdentifier(a.property, { name: "dirname" }))
            );
            const hasReq = args.some((a) => !t.isSpreadElement(a) && expressionUsesReq(a));
            if (hasDirname && hasReq) {
              let hasNormalize = false;
              path.findParent((p) => {
                if (!p.isCallExpression()) return false;
                const c = p.node.callee;
                if (
                  t.isMemberExpression(c) &&
                  !c.computed &&
                  t.isIdentifier(c.object, { name: "path" }) &&
                  t.isIdentifier(c.property, { name: "normalize" })
                ) {
                  hasNormalize = true;
                  return true;
                }
                return false;
              });
              if (!hasNormalize) {
                out.push({
                  ruleId: "RULE-INJ-004",
                  message:
                    "Possible path traversal: path.join(__dirname, user input) without path.normalize + prefix check.",
                  cwe: "CWE-22",
                  owasp: "A01:2021",
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
