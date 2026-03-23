import type { FindingRouteRef, RouteNode } from "../types.js";

export function findingRouteFromNode(r: RouteNode): FindingRouteRef {
  return {
    method: r.method,
    path: r.path,
    fullPath: r.fullPath,
    middlewares: [...r.middlewares],
  };
}
