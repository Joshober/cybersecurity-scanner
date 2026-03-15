// Path traversal: user input as file path can escape directory. Restrict to a safe directory; validate paths. Taint engine reports tainted flow to fs.readFile etc.

import type { Node } from "estree";
import type { Rule, RuleContext } from "../../system/utils/rule-types.js";
import { getCalleeName, parseCalleeParts } from "../../system/utils/helpers.js";

const FILE_READ_METHODS = new Set(["readFile", "readFileSync", "readdir", "readdirSync", "createReadStream", "existsSync"]);
const FS_OBJECTS = new Set(["fs", "fsPromises", "require"]);

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
    const name = getCalleeName(node);
    if (!name) return;
    const { obj, method } = parseCalleeParts(name);
    if (!method || !FILE_READ_METHODS.has(method)) return;
    if (!obj || !FS_OBJECTS.has(obj)) return;
    const firstArg = node.arguments[0];
    if (!firstArg) return;
    if (firstArg.type === "Identifier" || firstArg.type === "MemberExpression") context.report(node);
    if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) context.report(node);
    if (firstArg.type === "BinaryExpression" && firstArg.operator === "+") context.report(node);
  },
};
