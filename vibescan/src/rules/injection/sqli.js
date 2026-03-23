import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

function isSqlSink(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  const prop = callee.property;
  if (!t.isIdentifier(prop)) return false;
  if (prop.name === "query" || prop.name === "execute") return true;
  if (t.isIdentifier(callee.object) && callee.object.name === "knex" && prop.name === "raw") return true;
  return false;
}

function argIsTaintedSql(arg) {
  if (!arg) return false;
  if (t.isTemplateLiteral(arg)) {
    return arg.expressions.some((e) => expressionUsesReq(e));
  }
  if (t.isBinaryExpression(arg) && arg.operator === "+") {
    return expressionUsesReq(arg.left) || expressionUsesReq(arg.right);
  }
  return expressionUsesReq(arg);
}

export const ruleInj001 = {
  id: "RULE-INJ-001",
  cwe: "CWE-89",
  owasp: "A03:2021",
  severity: "critical",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;
          if (!isSqlSink(callee)) return;
          const sqlArg = args[0];
          if (!argIsTaintedSql(sqlArg)) return;
          out.push({
            ruleId: "RULE-INJ-001",
            message:
              "Possible SQL injection: user-controlled data flows into db.query/execute/knex.raw without parameterization.",
            cwe: "CWE-89",
            owasp: "A03:2021",
            severity: "critical",
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
