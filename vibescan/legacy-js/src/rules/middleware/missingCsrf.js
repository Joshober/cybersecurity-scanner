import { routeHasCsrfMiddleware } from "../utils.js";

const STATE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const ruleMw001 = {
  id: "RULE-MW-001",
  cwe: "CWE-352",
  owasp: "A01:2021",
  severity: "low",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    for (const route of ctx.routes) {
      if (!STATE.has(route.method)) continue;
      if (routeHasCsrfMiddleware(route)) continue;
      out.push({
        ruleId: "RULE-MW-001",
        message: `CSRF middleware not detected for ${route.method} ${route.fullPath} (heuristic).`,
        cwe: "CWE-352",
        owasp: "A01:2021",
        severity: "low",
        file: route.file,
        line: route.line,
        snippet: route.middlewares.join(", ") || "(none)",
      });
    }
    return out;
  },
};
