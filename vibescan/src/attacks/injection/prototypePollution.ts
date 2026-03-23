/** Prototype pollution payloads for rules and generated tests (chain-inspection oracle). */
import type { Node, Expression, CallExpression, MemberExpression } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts } from "../../system/utils/helpers.js";

export const PROTO_JSON_PAYLOAD = { __proto__: { polluted: true } } as const;

/** Legacy export name — same as PROTO_JSON_PAYLOAD. */
export const PROTO_PAYLOADS_JSON = PROTO_JSON_PAYLOAD;

export const PROTO_PATH_PAYLOADS = [
  "__proto__.isAdmin",
  "constructor.prototype.shell",
  "__proto__.polluted",
] as const;

/** Legacy export — same paths (includes extra chain example). */
export const PROTO_PAYLOADS_PATH = PROTO_PATH_PAYLOADS;

/** Form-encoded prototype pollution probe. */
export const PROTO_FORM_PAYLOAD = "__proto__[polluted]=true" as const;

const DANGEROUS_MERGE_METHODS = new Set(["merge", "mergewith", "defaultsdeep", "set", "assign", "extend"]);

function isReqPropertyMember(node: Expression): boolean {
  if (node.type !== "MemberExpression" || node.object.type !== "Identifier") return false;
  if (node.object.name !== "req") return false;
  if (node.property.type !== "Identifier") return false;
  return node.property.name === "body" || node.property.name === "query" || node.property.name === "params";
}

function isDangerousPrototypePathLiteral(node: Expression): boolean {
  if (node.type !== "Literal" || typeof node.value !== "string") return false;
  const v = node.value.toLowerCase();
  return v.includes("__proto__") || v.includes("constructor.prototype");
}

function memberPropName(node: MemberExpression): string | null {
  if (node.property.type === "Identifier") return node.property.name;
  if (node.property.type === "Literal" && typeof node.property.value === "string") return node.property.value;
  return null;
}

function hasUserInputSource(node: Node | null | undefined): boolean {
  if (!node) return false;
  if (node.type === "MemberExpression") {
    if (isReqPropertyMember(node)) return true;
    return hasUserInputSource(node.object) || hasUserInputSource(node.property);
  }
  if (node.type === "Identifier") {
    const n = node.name.toLowerCase();
    return n.includes("payload") || n.includes("input") || n.includes("body");
  }
  if (node.type === "ObjectExpression") return node.properties.some((p) => p.type === "Property" && hasUserInputSource(p.value));
  if (node.type === "ArrayExpression") return node.elements.some((e) => hasUserInputSource(e ?? undefined));
  if (node.type === "CallExpression") return node.arguments.some((a) => hasUserInputSource(a));
  if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
    return hasUserInputSource(node.left) || hasUserInputSource(node.right);
  }
  if (node.type === "ConditionalExpression") {
    return (
      hasUserInputSource(node.test) || hasUserInputSource(node.consequent) || hasUserInputSource(node.alternate)
    );
  }
  return false;
}

function isObjectAssignLike(name: string | null): boolean {
  return name === "Object.assign" || name === "assign";
}

function hasUnsafeMergeSignature(node: CallExpression): boolean {
  const args = node.arguments;
  if (args.length === 0) return false;
  return args.some((a) => hasUserInputSource(a.type === "SpreadElement" ? a.argument : a));
}

function isUnsafeSetPath(node: CallExpression): boolean {
  const rawPathArg = node.arguments[1];
  const pathArg = rawPathArg?.type === "SpreadElement" ? rawPathArg.argument : rawPathArg;
  if (!pathArg || !isDangerousPrototypePathLiteral(pathArg)) return false;
  const rawValueArg = node.arguments[2];
  const valueArg = rawValueArg?.type === "SpreadElement" ? rawValueArg.argument : rawValueArg;
  const rawTargetArg = node.arguments[0];
  const targetArg = rawTargetArg?.type === "SpreadElement" ? rawTargetArg.argument : rawTargetArg;
  return hasUserInputSource(valueArg) || hasUserInputSource(targetArg);
}

export const prototypePollutionRule: Rule = {
  id: "RULE-PROTO-001",
  message: "Potential prototype pollution via unsafe deep merge / set with user-controlled input.",
  why: "Merging attacker-controlled keys like __proto__ or constructor.prototype can mutate object prototypes globally.",
  fix: "Validate/strip dangerous keys (__proto__, constructor, prototype), use safe merge libraries, and reject nested prototype paths.",
  remediation: "Block prototype keys before merge/set and avoid deep merge on untrusted objects.",
  cwe: 1321,
  owasp: "A03:2021",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    const method = name ? parseCalleeParts(name).method?.toLowerCase() ?? null : null;

    if (method && DANGEROUS_MERGE_METHODS.has(method) && hasUnsafeMergeSignature(node)) {
      context.report(node, { cwe: 1321, owasp: "A03:2021", findingKind: "PROTOTYPE_POLLUTION" });
      return;
    }

    if (isObjectAssignLike(name) && hasUnsafeMergeSignature(node)) {
      context.report(node, { cwe: 1321, owasp: "A03:2021", findingKind: "PROTOTYPE_POLLUTION" });
      return;
    }

    if (method === "set" && isUnsafeSetPath(node)) {
      context.report(node, { cwe: 1321, owasp: "A03:2021", findingKind: "PROTOTYPE_POLLUTION" });
      return;
    }

    if (name?.endsWith(".set")) {
      const callee = node.callee;
      if (callee.type === "MemberExpression") {
        const prop = memberPropName(callee);
        if (prop === "set" && isUnsafeSetPath(node)) {
          context.report(node, { cwe: 1321, owasp: "A03:2021", findingKind: "PROTOTYPE_POLLUTION" });
        }
      }
    }
  },
};
