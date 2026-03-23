import { ruleInj001 } from "./injection/sqli.js";
import { ruleInj002 } from "./injection/xss.js";
import { ruleInj003 } from "./injection/commandInjection.js";
import { ruleInj004 } from "./injection/pathTraversal.js";
import { ruleInj005 } from "./injection/ssrf.js";
import { ruleAuth001 } from "./auth/bola.js";
import { ruleAuth002 } from "./auth/weakJwt.js";
import { ruleAuth003 } from "./auth/missingAuth.js";
import { ruleAuth004 } from "./auth/cookieFlags.js";
import { ruleMw001 } from "./middleware/missingCsrf.js";
import { ruleMw002 } from "./middleware/missingRateLimit.js";
import { ruleMw003 } from "./middleware/missingHelmet.js";
import { ruleMw004 } from "./middleware/corsWildcard.js";
import { ruleSec001 } from "./secrets/hardcodedCreds.js";
import { ruleSec002 } from "./secrets/envFallback.js";
import { ruleSec003 } from "./secrets/evalWithInput.js";
import { ruleProto001 } from "./prototype/unsafeMerge.js";
import { ruleProto002 } from "./prototype/pathDefinition.js";

/** All registered rules (order = scan order). */
export const rules = [
  ruleInj001,
  ruleInj002,
  ruleInj003,
  ruleInj004,
  ruleInj005,
  ruleAuth001,
  ruleAuth002,
  ruleAuth003,
  ruleAuth004,
  ruleMw001,
  ruleMw002,
  ruleMw003,
  ruleMw004,
  ruleSec001,
  ruleSec002,
  ruleSec003,
  ruleProto001,
  ruleProto002,
];

export function listRulesMeta() {
  return rules.map((r) => ({
    id: r.id,
    cwe: r.cwe,
    owasp: r.owasp,
    severity: r.severity,
  }));
}
