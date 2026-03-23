import * as t from "@babel/types";
import { traverse, handlerReferencesUser } from "../utils.js";

function handlerHasRiskyLookup(fnNode) {
  let risky = false;
  const wrap = t.file(t.program([t.expressionStatement(fnNode)]));
  traverse(wrap, {
    CallExpression(path) {
      const { callee, arguments: args } = path.node;
      if (!t.isMemberExpression(callee) || callee.computed) return;
      const prop = callee.property;
      if (!t.isIdentifier(prop)) return;
      if (prop.name !== "findById" && prop.name !== "findOne") return;
      const hasParams = args.some((a) => !t.isSpreadElement(a) && expressionUsesReqParams(a));
      if (hasParams) risky = true;
    },
  });
  return risky;
}

/**
 * @param {import('@babel/types').Node} node
 */
function expressionUsesReqParams(node) {
  if (!node) return false;
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object, { name: "req" })) {
      if (t.isIdentifier(node.property, { name: "params" })) return true;
    }
    return expressionUsesReqParams(node.object);
  }
  if (t.isCallExpression(node)) {
    return node.arguments.some((a) => !t.isSpreadElement(a) && expressionUsesReqParams(a));
  }
  if (t.isObjectExpression(node)) {
    return node.properties.some((p) => {
      if (t.isObjectProperty(p) && t.isExpression(p.value)) return expressionUsesReqParams(p.value);
      return false;
    });
  }
  return false;
}

export const ruleAuth001 = {
  id: "RULE-AUTH-001",
  cwe: "CWE-639",
  owasp: "API1:2023",
  severity: "medium",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    for (const route of ctx.routes) {
      const fn = route.handlerNode;
      if (!fn || (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn))) continue;
      if (!handlerHasRiskyLookup(fn)) continue;
      if (handlerReferencesUser(fn)) continue;
      out.push({
        ruleId: "RULE-AUTH-001",
        message:
          "Possible BOLA: resource lookup by id from req.params without obvious req.user ownership check in the same handler.",
        cwe: "CWE-639",
        owasp: "API1:2023",
        severity: "medium",
        file: route.file,
        line: route.line,
        snippet: route.handlerSource.slice(0, 200),
      });
    }
    return out;
  },
};
