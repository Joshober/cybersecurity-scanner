// Sequelize / similar ORM: request fields flow into where clauses or model writes (NoSQL/SQL hybrid apps).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCallMethodName, referencesReq } from "../../system/utils/helpers.js";

const ORM_METHODS = new Set([
  "find",
  "findOne",
  "findAll",
  "findByPk",
  "findOneAndUpdate",
  "update",
  "destroy",
  "upsert",
  "bulkCreate",
  "create",
]);

/** Keys often tied to auth/session lookup; identifier values are treated as externally influenced (e.g. passport-local `username`, session `uid`). */
const ORM_SENSITIVE_KEYS = new Set([
  "login",
  "email",
  "username",
  "password",
  "name",
  "id",
  "uid",
  "userId",
  "userid",
  "token",
]);

function propertyKeyName(p: import("estree").Property): string | null {
  const k = p.key;
  if (k.type === "Identifier") return k.name;
  if (k.type === "Literal" && typeof k.value === "string") return k.value;
  return null;
}

function valueMayBeUntrusted(node: Node, propKey: string | null): boolean {
  if (referencesReq(node)) return true;
  if (node.type === "Identifier" && propKey !== null && ORM_SENSITIVE_KEYS.has(propKey)) return true;
  return false;
}

function getWhereProperty(obj: import("estree").ObjectExpression): import("estree").Node | null {
  for (const p of obj.properties) {
    if (p.type !== "Property") continue;
    const k = p.key;
    const name =
      k.type === "Identifier" ? k.name : k.type === "Literal" && typeof k.value === "string" ? k.value : null;
    if (name === "where") return p.value;
  }
  return null;
}

function objectSpreadsRequestData(node: Node): boolean {
  if (node.type !== "ObjectExpression") return false;
  for (const p of node.properties) {
    if (p.type === "SpreadElement" && referencesReq(p.argument)) return true;
  }
  return false;
}

function ormOptionsContainReqInput(options: Node): boolean {
  if (options.type !== "ObjectExpression") return false;
  if (objectSpreadsRequestData(options)) return true;
  const where = getWhereProperty(options);
  if (where && referencesReq(where)) return true;
  if (where?.type === "ObjectExpression") {
    for (const p of where.properties) {
      if (p.type !== "Property") continue;
      const kn = propertyKeyName(p);
      const v = p.value as Node;
      if (valueMayBeUntrusted(v, kn)) return true;
      if (v.type === "ObjectExpression") {
        for (const inner of v.properties) {
          if (inner.type !== "Property") continue;
          const ikn = propertyKeyName(inner);
          if (valueMayBeUntrusted(inner.value as Node, ikn)) return true;
        }
      }
    }
  }
  for (const p of options.properties) {
    if (p.type !== "Property") continue;
    const name = propertyKeyName(p);
    if (name === "where") continue;
    // create({ email: req.body.email, ... }) or { login: username } (passport-local)
    if (valueMayBeUntrusted(p.value as Node, name)) return true;
  }
  return false;
}

export const ormRequestInputRule: Rule = {
  id: "injection.orm.request-in-query",
  message: "ORM query or write incorporates HTTP request fields without validation.",
  why: "User-controlled values in Sequelize/ORM where clauses or model creates enable injection or unsafe updates (including NoSQL-style operators when enabled).",
  fix: "Validate and normalize inputs. Use parameterized APIs and avoid passing raw req.body / req.query into where or create payloads.",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const method = getCallMethodName(node);
    if (!method || !ORM_METHODS.has(method)) return;
    const arg0 = node.arguments[0];
    if (!arg0 || arg0.type !== "ObjectExpression") return;
    if (!ormOptionsContainReqInput(arg0)) return;
    context.report(node);
  },
};
