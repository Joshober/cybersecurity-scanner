// Path traversal: user input as file path can escape directory. Restrict to a safe directory; validate paths. Taint engine reports tainted flow to fs.readFile etc.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import {
  describeCalleeName,
  getCalleeName,
  looksStringLikeType,
} from "../../system/utils/helpers.js";
import {
  getImportedPathSinkCallee,
  getPathSinkCallee,
} from "../../system/sinks/index.js";

export const PATH_TRAVERSAL_PAYLOADS = [
  "../../../etc/passwd",
  "..%2F..%2F..%2Fetc%2Fshadow",
  "....//....//etc/passwd",
  "%252e%252e%252fetc%252fpasswd",
  "..\\..\\..\\windows\\system32",
] as const;

export const pathTraversalRule: Rule = {
  id: "injection.path-traversal",
  message: "File path may be derived from user input, enabling path traversal.",
  why: "If the path comes from req.query, req.params, or similar, an attacker can use '../' to read or write outside intended directories.",
  fix: "Resolve paths against a fixed base directory and normalize, e.g. path.join(BASE_DIR, path.normalize(userPath)). Do not use user input directly as a path.",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const resolved = context.getResolvedCallee?.(node);
    const callee = describeCalleeName(resolved?.calleeName ?? getCalleeName(node));
    const method = resolved?.importSource && resolved?.symbolName ? resolved.symbolName : callee.methodName;
    if (!method) return;
    const sink =
      getPathSinkCallee(callee.objectName ?? "", method) ??
      getImportedPathSinkCallee(resolved?.importSource, method);
    if (!sink) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    const typeText = context.getTypeText?.(firstArg);
    if (!looksStringLikeType(typeText)) return;
    if (firstArg.type === "Identifier" || firstArg.type === "MemberExpression") context.report(node);
    if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) context.report(node);
    if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") context.report(node);
  },
};
