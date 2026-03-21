// Middleware chain audit for state-changing routes (requires route graph).

import type { Finding, RouteNode } from "../types.js";
import {
  AUTH_MIDDLEWARE,
  CSRF_MIDDLEWARE,
  RATE_LIMIT_MIDDLEWARE,
  chainMatchesList,
} from "../utils/middlewareNames.js";
import { isSensitivePath } from "../utils/sensitiveRoutes.js";

const STATE_CHANGING = new Set<RouteNode["method"]>(["POST", "PUT", "PATCH", "DELETE"]);

export function runMiddlewareAudit(routes: RouteNode[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of routes) {
    if (!STATE_CHANGING.has(r.method)) continue;
    const m = r.middlewares;
    const sensitive = isSensitivePath(r.fullPath);

    if (!chainMatchesList(m, AUTH_MIDDLEWARE)) {
      findings.push({
        ruleId: "AUTH-003",
        message: `Missing auth middleware on ${r.method} ${r.fullPath}`,
        why: "State-changing endpoints without authentication are vulnerable to unauthorized use (BOLA-style abuse).",
        fix: "Apply authentication middleware (e.g. JWT verify, passport) before the handler.",
        cwe: 285,
        owasp: "A01:2021",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        findingKind: "MIDDLEWARE_MISSING",
        line: r.line,
        column: 0,
        filePath: r.file,
        source: `${r.file}:${r.line}`,
      });
    }
    if (!chainMatchesList(m, CSRF_MIDDLEWARE)) {
      findings.push({
        ruleId: "MW-001",
        message: `Missing CSRF protection on ${r.method} ${r.fullPath}`,
        why: "Cross-site requests can trigger unwanted state changes without a CSRF token or SameSite strategy.",
        fix: "Use csrf/csurf/doubleCsrf or strict SameSite cookies for session auth.",
        cwe: 352,
        owasp: "A05:2021",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        findingKind: "MIDDLEWARE_MISSING",
        line: r.line,
        column: 0,
        filePath: r.file,
        source: `${r.file}:${r.line}`,
      });
    }
    if (sensitive && !chainMatchesList(m, RATE_LIMIT_MIDDLEWARE)) {
      findings.push({
        ruleId: "MW-002",
        message: `Sensitive path ${r.fullPath} lacks rate limiting`,
        why: "Login/register/token endpoints are brute-force targets without throttling.",
        fix: "Add express-rate-limit or similar on this route.",
        cwe: 307,
        owasp: "A07:2021",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        findingKind: "MIDDLEWARE_MISSING",
        line: r.line,
        column: 0,
        filePath: r.file,
        source: `${r.file}:${r.line}`,
      });
    }
  }
  return findings;
}
