import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCallMethodName, referencesReq } from "../../system/utils/helpers.js";

const OBJECT_ACCESS_METHODS = new Set([
  "findByPk",
  "findOne",
  "update",
  "updateOne",
  "deleteOne",
  "destroy",
]);

function isParamsIdReference(node: Node): boolean {
  if (node.type !== "MemberExpression") return false;
  if (node.object.type === "Identifier" && node.object.name === "id") return true;
  let cur: Node = node;
  while (cur.type === "MemberExpression") {
    const m = cur as import("estree").MemberExpression;
    if (
      m.object.type === "MemberExpression" &&
      m.object.object.type === "Identifier" &&
      (m.object.object.name === "req" || m.object.object.name === "request") &&
      m.object.property.type === "Identifier" &&
      m.object.property.name === "params"
    ) {
      return true;
    }
    cur = m.object;
  }
  return false;
}

export const authzIdorDirectObjectReferenceRule: Rule = {
  id: "authz.idor.direct-object-reference",
  message: "Direct object reference from route params without ownership/authz checks can enable IDOR.",
  why: "Using req.params identifiers directly in object access queries often bypasses per-user authorization checks and can expose other users' data.",
  fix: "Enforce ownership/authorization checks before object access, and bind lookup identifiers to authenticated user context.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const method = getCallMethodName(node);
    if (!method || !OBJECT_ACCESS_METHODS.has(method)) return;
    const arg0 = node.arguments[0];
    if (!arg0 || arg0.type === "SpreadElement") return;
    if (isParamsIdReference(arg0) || referencesReq(arg0)) {
      context.report(node);
    }
  },
};
