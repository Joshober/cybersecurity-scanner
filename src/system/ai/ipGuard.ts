// RULE-SSRF-003 — ip.isPublic / ip.isPrivate are insufficient SSRF defenses (CVE class).

import type { Node } from "estree";
import type { Rule, RuleContext } from "../utils/rule-types.js";
import { getCalleeName } from "../utils/helpers.js";

export const ipGuardSsrRule: Rule = {
  id: "RULE-SSRF-003",
  message: "IP allow/block checks (ip.isPublic/isPrivate) are insufficient as the sole SSRF defense.",
  why: "Parsing and normalization bypasses can still reach metadata or loopback endpoints.",
  fix: "Use an explicit host allowlist and block private/link-local ranges with a hardened URL parser.",
  remediation: "Prefer allowlisted URLs; do not rely only on ip.isPublic/isPrivate before fetch.",
  cwe: 918,
  owasp: "A10:2021",
  severity: "warning",
  category: "injection",
  nodeTypes: ["CallExpression"],
  check(context: RuleContext, node: Node) {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    if (name === "ip.isPublic" || name === "ip.isPrivate") {
      context.report(node, {
        findingKind: "INSUFFICIENT_SSRF_DEFENSE",
        cveRef: ["CVE-2023-42282", "CVE-2024-29415"],
        cwe: 918,
        owasp: "A10:2021",
      });
    }
  },
};
