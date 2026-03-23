// Middleware chain audit: state-changing routes + object-scoped GET/HEAD (requires route graph).

import type { Finding, RouteNode } from "../types.js";
import {
  AUTH_MIDDLEWARE,
  CSRF_MIDDLEWARE,
  RATE_LIMIT_MIDDLEWARE,
  chainMatchesList,
} from "../utils/middlewareNames.js";
import { isSensitivePath } from "../utils/sensitiveRoutes.js";
import { isAdminSensitivePath } from "../utils/adminPaths.js";
import { findingRouteFromNode } from "../utils/routeFindingMeta.js";

const STATE_CHANGING = new Set<RouteNode["method"]>(["POST", "PUT", "PATCH", "DELETE"]);

const OBJECT_FETCH = new Set<RouteNode["method"]>(["GET", "HEAD"]);

function isObjectScopedRoute(r: RouteNode): boolean {
  return r.params.length > 0;
}

export function runMiddlewareAudit(routes: RouteNode[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of routes) {
    const m = r.middlewares;
    const sensitive = isSensitivePath(r.fullPath);
    const adminish = isAdminSensitivePath(r.fullPath);
    const hasAuth = chainMatchesList(m, AUTH_MIDDLEWARE);
    const stateChanging = STATE_CHANGING.has(r.method);
    const objectFetch = OBJECT_FETCH.has(r.method) && isObjectScopedRoute(r);

    if (!stateChanging && !objectFetch) continue;

    if (objectFetch && !hasAuth) {
      findings.push({
        ruleId: "AUTH-005",
        message: `Missing auth middleware on object-scoped ${r.method} ${r.fullPath}`,
        why: "Read endpoints that take resource identifiers often expose user-specific data; without authentication, they are a common BOLA/IDOR testing target.",
        remediation: "Require authentication before returning resource representations; enforce object-level authorization.",
        fix: "Require authentication before returning resource representations; enforce object-level authorization.",
        cwe: 285,
        owasp: "API3:2023",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        findingKind: "MIDDLEWARE_MISSING",
        line: r.line,
        column: 0,
        filePath: r.file,
        source: `${r.file}:${r.line}`,
        route: findingRouteFromNode(r),
      });
    }

    if (stateChanging) {
      if (!hasAuth) {
        if (adminish) {
          findings.push({
            ruleId: "AUTH-004",
            message: `Missing auth on sensitive admin/mod route ${r.method} ${r.fullPath}`,
            why: "Admin, moderation, and abuse-handling routes must require authentication and authorization.",
            remediation: "Require authentication and role checks (e.g. admin-only middleware) before this handler.",
            fix: "Require authentication and role checks (e.g. admin-only middleware) before this handler.",
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
            route: findingRouteFromNode(r),
          });
        } else if (sensitive) {
          findings.push({
            ruleId: "AUTH-003",
            message: `Missing auth middleware on sensitive route ${r.method} ${r.fullPath}`,
            why: "State-changing endpoints on login, registration, upload, webhook, or similar surfaces without recognizable authentication are high-risk for abuse.",
            remediation: "Apply authentication middleware (e.g. JWT verify, passport) before the handler where appropriate.",
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
            route: findingRouteFromNode(r),
          });
        }
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
          route: findingRouteFromNode(r),
        });
      }
      if (sensitive && !chainMatchesList(m, RATE_LIMIT_MIDDLEWARE)) {
        findings.push({
          ruleId: "MW-002",
          message: `Sensitive path ${r.fullPath} lacks rate limiting`,
          why: "Auth, upload, webhook, and messaging endpoints are abuse targets without throttling.",
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
          route: findingRouteFromNode(r),
        });
      }
    }
  }
  return findings;
}
