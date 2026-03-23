import { routeHasRateLimitMiddleware, routeNeedsRateLimitHeuristic } from "../utils.js";

export const ruleMw002 = {
  id: "RULE-MW-002",
  cwe: "CWE-770",
  owasp: "API4:2023",
  severity: "medium",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    for (const route of ctx.routes) {
      if (!routeNeedsRateLimitHeuristic(route.fullPath)) continue;
      if (routeHasRateLimitMiddleware(route)) continue;
      out.push({
        ruleId: "RULE-MW-002",
        message: `Sensitive path ${route.fullPath} may need rate limiting (none detected in static chain).`,
        cwe: "CWE-770",
        owasp: "API4:2023",
        severity: "medium",
        file: route.file,
        line: route.line,
        snippet: route.middlewares.join(", ") || "(none)",
      });
    }
    return out;
  },
};
