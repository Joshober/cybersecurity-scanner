import * as t from "@babel/types";
import { traverse, forEachParsedFile } from "../utils.js";

function callIsHelmetUse(path) {
  const { node } = path;
  if (!t.isCallExpression(node)) return false;
  const { callee, arguments: args } = node;
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  if (!t.isIdentifier(callee.property, { name: "use" })) return false;
  const a0 = args[0];
  if (!a0 || !t.isCallExpression(a0)) return false;
  const ic = a0.callee;
  return t.isIdentifier(ic, { name: "helmet" });
}

function hasSecurityHeadersInFile(ast) {
  let ok = false;
  traverse(ast, {
    Literal(p) {
      const v = p.node.value;
      if (typeof v !== "string") return;
      if (
        v === "X-Content-Type-Options" ||
        v === "X-Frame-Options" ||
        v === "Content-Security-Policy"
      ) {
        ok = true;
      }
    },
  });
  return ok;
}

export const ruleMw003 = {
  id: "RULE-MW-003",
  cwe: "CWE-693",
  owasp: "A05:2021",
  severity: "low",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    let sawHelmet = false;
    let manualHeaders = false;
    forEachParsedFile(ctx, ({ ast }) => {
      traverse(ast, {
        CallExpression(path) {
          if (callIsHelmetUse(path)) sawHelmet = true;
        },
      });
      if (hasSecurityHeadersInFile(ast)) manualHeaders = true;
    });
    if (!sawHelmet && !manualHeaders) {
      const fileHint = ctx.files[0]?.path ?? ctx.rootDir;
      out.push({
        ruleId: "RULE-MW-003",
        message:
          "No helmet() or obvious security headers (X-Content-Type-Options, X-Frame-Options, CSP) detected in scanned files.",
        cwe: "CWE-693",
        owasp: "A05:2021",
        severity: "low",
        file: fileHint,
        line: 0,
        snippet: "",
      });
    }
    return out;
  },
};
