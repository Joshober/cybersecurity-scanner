import { routeHasAuthMiddleware } from "../utils.js";

const STATE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const ruleAuth003 = {
  id: "RULE-AUTH-003",
  cwe: "CWE-306",
  owasp: "A07:2021",
  severity: "medium",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    for (const route of ctx.routes) {
      if (!STATE.has(route.method)) continue;
      if (routeHasAuthMiddleware(route)) continue;
      out.push({
        ruleId: "RULE-AUTH-003",
        message: `State-changing route ${route.method} ${route.fullPath} has no obvious auth middleware in the static chain.`,
        cwe: "CWE-306",
        owasp: "A07:2021",
        severity: "medium",
        file: route.file,
        line: route.line,
        snippet: route.middlewares.join(", ") || "(none)",
      });
    }
    return out;
  },
};
