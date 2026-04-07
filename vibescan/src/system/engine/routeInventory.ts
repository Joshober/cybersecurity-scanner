// Route inventory labels + aggregate posture finding (trust-boundary visibility).

import type { Finding, RouteInventoryEntry, RouteNode } from "../types.js";
import { isSensitivePath } from "../utils/sensitiveRoutes.js";
import { isAdminSensitivePath } from "../utils/adminPaths.js";
import { AUTH_MIDDLEWARE, chainMatchesList } from "../utils/middlewareNames.js";
import { isWebhookLikePath } from "../utils/webhookPathHints.js";
import { makeFinding } from "../utils/makeFinding.js";

/** Route has path parameters (`:id`, etc.) — shared between middleware audit and inventory. */
export function isObjectScopedRoute(r: RouteNode): boolean {
  return r.params.length > 0;
}

function riskTags(r: RouteNode, sensitive: boolean, admin: boolean): string[] {
  const tags: string[] = [];
  if (admin) tags.push("admin");
  if (isWebhookLikePath(r.fullPath)) tags.push("webhook");
  if (/\/upload/i.test(r.fullPath)) tags.push("upload");
  if (sensitive && !admin) tags.push("auth-sensitive");
  return tags;
}

export function buildRouteInventory(routes: RouteNode[]): RouteInventoryEntry[] {
  return routes.map((r) => {
    const sensitivePath = isSensitivePath(r.fullPath);
    const adminPath = isAdminSensitivePath(r.fullPath);
    return {
      method: r.method,
      path: r.path,
      fullPath: r.fullPath,
      file: r.file,
      line: r.line,
      middlewares: [...r.middlewares],
      tags: riskTags(r, sensitivePath, adminPath),
      sensitivePath,
      adminPath,
      objectScoped: isObjectScopedRoute(r),
      hasAuthMiddleware: chainMatchesList(r.middlewares, AUTH_MIDDLEWARE),
    };
  });
}

/**
 * One informational finding summarizing object-scoped routes without auth middleware.
 * Does not prove IDOR; supports manual test prioritization.
 */
export function runRoutePostureFinding(routes: RouteNode[]): Finding[] {
  const inv = buildRouteInventory(routes);
  const risky = inv.filter((e) => e.objectScoped && !e.hasAuthMiddleware);
  if (risky.length === 0) return [];

  const primary = risky[0]!;
  return [
    makeFinding({
      ruleId: "API-POSTURE-001",
      message: `${risky.length} object-scoped route(s) lack recognizable auth middleware (heuristic; prioritize BOLA/IDOR testing).`,
      why: "Static analysis cannot prove cross-user object access, but undocumented or unauthenticated :id-style routes are a common precondition for broken object-level authorization.",
      remediation: "Verify per-object authorization, add explicit auth middleware, and document routes in OpenAPI.",
      fix: "Verify per-object authorization, add explicit auth middleware, and document routes in OpenAPI.",
      severity: "info",
      category: "api_inventory",
      cwe: 285,
      owasp: "API3:2023",
      findingKind: "ROUTE_POSTURE",
      line: primary.line,
      column: 0,
      filePath: primary.file,
      source: `${primary.file}:${primary.line}`,
      route: {
        method: primary.method,
        path: primary.path,
        fullPath: primary.fullPath,
        middlewares: [...primary.middlewares],
      },
    }),
  ];
}
