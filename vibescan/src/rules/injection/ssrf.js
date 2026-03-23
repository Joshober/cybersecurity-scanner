import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode, expressionUsesReq } from "../utils.js";

function isFetchCall(callee) {
  return t.isIdentifier(callee, { name: "fetch" });
}

function isHttpGet(callee) {
  if (!t.isMemberExpression(callee) || callee.computed) return false;
  if (!t.isIdentifier(callee.property, { name: "get" })) return false;
  const o = callee.object;
  return t.isIdentifier(o, { name: "http" }) || t.isIdentifier(o, { name: "https" });
}

function axiosConfigHasUserUrl(node) {
  if (!t.isObjectExpression(node)) return false;
  for (const p of node.properties) {
    if (!t.isObjectProperty(p) || p.computed) continue;
    const key = p.key;
    if (!t.isIdentifier(key, { name: "url" }) && !t.isStringLiteral(key, { value: "url" })) continue;
    if (t.isExpression(p.value) && expressionUsesReq(p.value)) return true;
  }
  return false;
}

function axiosConfigHasBaseURL(node) {
  if (!t.isObjectExpression(node)) return false;
  return node.properties.some(
    (p) =>
      t.isObjectProperty(p) &&
      !p.computed &&
      (t.isIdentifier(p.key, { name: "baseURL" }) || t.isStringLiteral(p.key, { value: "baseURL" }))
  );
}

export const ruleInj005 = {
  id: "RULE-INJ-005",
  cwe: "CWE-918",
  owasp: "A10:2021",
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
            if (t.isIdentifier(prop) && (prop.name === "isPublic" || prop.name === "isPrivate")) {
              const obj = callee.object;
              if (t.isIdentifier(obj, { name: "ip" })) {
                out.push({
                  ruleId: "RULE-SSRF-003",
                  message:
                    "SSRF guard uses ip.isPublic()/isPrivate() — may be insufficient; prefer strict URL parsing and allowlists.",
                  cwe: "CWE-918",
                  owasp: "A10:2021",
                  severity: "medium",
                  file: filePath,
                  line: nodeLine(path.node),
                  snippet: snippetForNode(source, path.node),
                });
              }
            }
          }

          if (isFetchCall(callee) && args[0] && expressionUsesReq(args[0])) {
            out.push({
              ruleId: "RULE-INJ-005",
              message: "Possible SSRF: fetch() URL derived from user input.",
              cwe: "CWE-918",
              owasp: "A10:2021",
              severity: "high",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
            return;
          }

          if (isHttpGet(callee) && args[0] && expressionUsesReq(args[0])) {
            out.push({
              ruleId: "RULE-INJ-005",
              message: "Possible SSRF: http(s).get URL derived from user input.",
              cwe: "CWE-918",
              owasp: "A10:2021",
              severity: "high",
              file: filePath,
              line: nodeLine(path.node),
              snippet: snippetForNode(source, path.node),
            });
            return;
          }

          if (t.isMemberExpression(callee) && !callee.computed) {
            const prop = callee.property;
            const obj = callee.object;
            if (t.isIdentifier(obj, { name: "axios" }) && t.isIdentifier(prop)) {
              if ((prop.name === "get" || prop.name === "post") && args[0] && expressionUsesReq(args[0])) {
                out.push({
                  ruleId: "RULE-INJ-005",
                  message: "Possible SSRF: axios request URL derived from user input.",
                  cwe: "CWE-918",
                  owasp: "A10:2021",
                  severity: "high",
                  file: filePath,
                  line: nodeLine(path.node),
                  snippet: snippetForNode(source, path.node),
                });
              }
            }
          }

          if (t.isIdentifier(callee, { name: "axios" }) && args[0] && t.isObjectExpression(args[0])) {
            const cfg = args[0];
            if (axiosConfigHasUserUrl(cfg)) {
              out.push({
                ruleId: "RULE-INJ-005",
                message: "Possible SSRF: axios config url derived from user input.",
                cwe: "CWE-918",
                owasp: "A10:2021",
                severity: "high",
                file: filePath,
                line: nodeLine(path.node),
                snippet: snippetForNode(source, path.node),
              });
              if (axiosConfigHasBaseURL(cfg)) {
                out.push({
                  ruleId: "RULE-SSRF-002",
                  message:
                    "Axios baseURL combined with user-influenced url can enable SSRF bypass patterns (review CVE-2024-39338 / related advisories).",
                  cwe: "CWE-918",
                  owasp: "A10:2021",
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
