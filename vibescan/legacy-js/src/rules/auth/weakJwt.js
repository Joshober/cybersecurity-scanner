import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode } from "../utils.js";
import { TIER1 } from "../../secrets/core-dict.js";
import { TIER2 } from "../../secrets/llm-dict.js";
import { shouldSkipHighEntropySecret } from "../../secrets/entropy.js";

const DICT = new Set([...TIER1, ...TIER2].map((s) => s.toLowerCase()));

/** @param {import('@babel/types').Node} node */
function isProcessEnvAccess(node) {
  if (!t.isMemberExpression(node)) return false;
  if (t.isIdentifier(node.object, { name: "process" }) && t.isIdentifier(node.property, { name: "env" })) {
    return true;
  }
  return isProcessEnvAccess(node.object);
}

function isWeakLiteral(node) {
  if (!t.isStringLiteral(node)) return false;
  const v = node.value;
  if (shouldSkipHighEntropySecret(v)) return false;
  return DICT.has(v.toLowerCase());
}

function jwtCallName(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return null;
  if (!t.isIdentifier(callee.object, { name: "jwt" })) return null;
  const p = callee.property;
  if (!t.isIdentifier(p)) return null;
  if (p.name === "sign" || p.name === "verify") return p.name;
  return null;
}

export const ruleAuth002 = {
  id: "RULE-AUTH-002",
  cwe: "CWE-521",
  owasp: "A02:2021",
  severity: "high",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;
          const j = jwtCallName(callee);
          if (!j) return;
          const secretArg = args[1];
          if (!secretArg) return;

          if (isWeakLiteral(secretArg)) {
            out.push({
              ruleId: "RULE-AUTH-002",
              message: "Weak or example JWT secret: string literal matches common insecure defaults.",
              cwe: "CWE-521",
              owasp: "A02:2021",
              severity: "high",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
            return;
          }

          if (t.isLogicalExpression(secretArg) && secretArg.operator === "||") {
            const left = secretArg.left;
            const right = secretArg.right;
            const leftIsEnv = isProcessEnvAccess(left);
            if (leftIsEnv && isWeakLiteral(right)) {
              out.push({
                ruleId: "RULE-SEC-004",
                message:
                  "Insecure JWT env fallback: process.env.* || weak default string (dictionary match).",
                cwe: "CWE-547",
                owasp: "A02:2021",
                severity: "high",
                file: filePath,
                line: nodeLine(path.node),
                snippet: snippetForNode(source, path.node),
              });
            }
          }
        },
      });
    });
    return out;
  },
};
