// SSRF-003 — ip.isPublic / ip.isPrivate used to gate outbound HTTP (insufficient defense; CVE class).

import type { BlockStatement, CallExpression, IfStatement, Node } from "estree";
import type { Rule, RuleContext } from "../utils/rule-types.js";
import { getCalleeName } from "../utils/helpers.js";
import { walk } from "../walker.js";

function isAncestorOf(ancestor: Node, node: Node, getParent: (n: Node) => Node | null): boolean {
  let p: Node | null = node;
  while (p) {
    if (p === ancestor) return true;
    p = getParent(p);
  }
  return false;
}

function enclosingIfWhoseTestContainsCall(
  callNode: Node,
  getParent: (n: Node) => Node | null
): IfStatement | null {
  let p: Node | null = getParent(callNode);
  while (p) {
    if (p.type === "IfStatement" && isAncestorOf(p.test, callNode, getParent)) {
      return p;
    }
    p = getParent(p);
  }
  return null;
}

function firstArgIdentifier(call: CallExpression): string | null {
  const a = call.arguments[0];
  if (a?.type === "Identifier") return a.name;
  return null;
}

function callLooksLikeHttpClient(name: string | null): boolean {
  if (!name) return false;
  if (name === "fetch") return true;
  if (name === "http.get" || name === "https.get" || name === "http.request" || name === "https.request")
    return true;
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".get") ||
    lower.endsWith(".post") ||
    lower.endsWith(".put") ||
    lower.endsWith(".patch") ||
    lower.endsWith(".delete") ||
    lower.endsWith(".request")
  );
}

function subtreeHasHttpCallWithArg(root: Node, id: string): boolean {
  let found = false;
  walk(root, (n) => {
    if (n.type !== "CallExpression" || found) return;
    const nm = getCalleeName(n);
    if (!callLooksLikeHttpClient(nm)) return;
    if (firstArgIdentifier(n) === id) found = true;
  });
  return found;
}

function consequentGuardsHttp(ifStmt: IfStatement, urlId: string): boolean {
  const cons = ifStmt.consequent;
  if (cons.type === "BlockStatement") {
    return (cons as BlockStatement).body.some((st) => subtreeHasHttpCallWithArg(st, urlId));
  }
  return subtreeHasHttpCallWithArg(cons, urlId);
}

export const ipGuardSsrRule: Rule = {
  id: "SSRF-003",
  message:
    "ip.isPublic() is an insufficient SSRF defense — bypassed by octal/hex/IPv6 IP forms",
  why: "The ip package misclassified several non-canonical IP shapes (CVEs below); do not rely on it as the sole SSRF control.",
  fix: "Use an explicit allowlist of expected hostnames instead of IP classification.",
  remediation: "Use an explicit allowlist of expected hostnames instead of IP classification",
  cwe: 918,
  owasp: "A10:2021",
  severity: "error",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (name !== "ip.isPublic" && name !== "ip.isPrivate") return;
    const urlId = firstArgIdentifier(node);
    if (!urlId) return;
    const ifStmt = enclosingIfWhoseTestContainsCall(node, context.getParent);
    if (!ifStmt) return;
    if (!consequentGuardsHttp(ifStmt, urlId)) return;
    context.report(node, {
      findingKind: "INSUFFICIENT_SSRF_DEFENSE",
      cveRef: [
        "CVE-2023-42282",
        "CVE-2024-29415",
        "CVE-2025-59436",
        "CVE-2025-59437",
      ],
      cwe: 918,
      owasp: "A10:2021",
    });
  },
};
