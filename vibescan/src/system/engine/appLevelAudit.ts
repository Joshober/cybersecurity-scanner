// App-level checks: helmet(), CORS origin: '*'.

import type { Node, ObjectExpression, Program } from "estree";
import type { Finding } from "../types.js";
import { walk } from "../walker.js";
import { getCalleeName } from "../utils/helpers.js";
import { HELMET_NAMES } from "../utils/middlewareNames.js";
import { makeFinding } from "../utils/makeFinding.js";

function corsOriginWildcard(opts: ObjectExpression): boolean {
  for (const p of opts.properties) {
    if (p.type !== "Property") continue;
    const k = p.key;
    const name =
      k.type === "Identifier" ? k.name : k.type === "Literal" && typeof k.value === "string" ? k.value : null;
    if (name !== "origin") continue;
    if (p.value.type === "Literal" && p.value.value === "*") return true;
  }
  return false;
}

export interface AppLevelAuditOptions {
  hasRoutes?: boolean;
  filePath?: string;
}

export function runAppLevelAudit(ast: Program, _source: string, opts?: AppLevelAuditOptions): Finding[] {
  const findings: Finding[] = [];
  let sawHelmet = false;

  walk(ast as unknown as Node, (node) => {
    if (node.type !== "CallExpression") return;
    const name = getCalleeName(node);
    if (!name) return;
    if (HELMET_NAMES.has(name) || name === "helmet") sawHelmet = true;
    if (name === "cors" && node.arguments[0]?.type === "ObjectExpression") {
      if (corsOriginWildcard(node.arguments[0])) {
        const loc = node.loc;
        if (!loc) return;
        findings.push(makeFinding({
          ruleId: "MW-004",
          message: "CORS configured with origin: '*' — any site can read responses.",
          why: "Wildcard origin removes browser same-origin protection for credentialed or sensitive responses.",
          fix: "Set origin to explicit allowlist or a function that validates the Origin header.",
          cwe: 942,
          owasp: "A05:2021",
          severity: "warning",
          category: "injection",
          findingKind: "APP_CONFIG",
          line: loc.start.line,
          column: loc.start.column,
          filePath: opts?.filePath,
        }));
      }
    }
  });

  if (!sawHelmet && opts?.hasRoutes) {
    findings.push(makeFinding({
      ruleId: "MW-003",
      message: "No helmet() call detected in this file — verify security headers are set.",
      why: "Without secure headers, apps are more vulnerable to XSS, clickjacking, and MIME sniffing.",
      fix: "Use helmet() at app bootstrap or equivalent header middleware.",
      cwe: 693,
      owasp: "A05:2021",
      severity: "info",
      category: "injection",
      findingKind: "APP_CONFIG",
      line: 1,
      column: 0,
      filePath: opts?.filePath,
    }));
  }

  return findings;
}
