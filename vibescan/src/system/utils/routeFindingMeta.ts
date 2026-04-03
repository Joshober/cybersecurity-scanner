import type { FindingRouteRef, RouteNode } from "../types.js";
import {
  AUTH_MIDDLEWARE,
  CSRF_MIDDLEWARE,
  RATE_LIMIT_MIDDLEWARE,
  chainMatchesList,
} from "./middlewareNames.js";

function middlewareEvidenceForChain(middlewares: string[]): string[] {
  const lines: string[] = [];
  lines.push(`Middleware count: ${middlewares.length} (order is registration order on this route).`);
  if (chainMatchesList(middlewares, AUTH_MIDDLEWARE)) {
    lines.push("Recognized auth-related identifier present in chain.");
  } else {
    lines.push("No identifier matched the built-in auth middleware name list.");
  }
  if (chainMatchesList(middlewares, CSRF_MIDDLEWARE)) {
    lines.push("Recognized CSRF-related middleware present.");
  }
  if (chainMatchesList(middlewares, RATE_LIMIT_MIDDLEWARE)) {
    lines.push("Recognized rate-limit middleware present.");
  }
  return lines;
}

export function findingRouteFromNode(r: RouteNode): FindingRouteRef {
  return {
    method: r.method,
    path: r.path,
    fullPath: r.fullPath,
    middlewares: [...r.middlewares],
    middlewareEvidence: middlewareEvidenceForChain(r.middlewares),
  };
}
