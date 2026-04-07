const LEGACY_RULE_FAMILY: Record<string, string> = {
  "SEC-004": "crypto.secrets",
  "SSRF-003": "injection.ssrf",
  "RULE-SSRF-002": "injection.ssrf",
  "SLOP-001": "supply_chain.registry",
  "AUTH-003": "auth.middleware",
  "AUTH-004": "auth.middleware",
  "AUTH-005": "auth.middleware",
  "MW-001": "middleware.order",
  "MW-002": "middleware.rate_limit",
  "MW-003": "middleware.headers",
  "MW-004": "middleware.cors",
  "API-INV-001": "api.inventory",
  "API-INV-002": "api.inventory",
  "API-AUTH-001": "api.auth_conformance",
  "API-POSTURE-001": "api.inventory",
  "WEBHOOK-001": "webhook.verification",
};

/** Stable family label for mixed legacy and dotted rule IDs. */
export function ruleFamilyForRuleId(ruleId: string): string | undefined {
  if (LEGACY_RULE_FAMILY[ruleId]) return LEGACY_RULE_FAMILY[ruleId];
  if (ruleId.includes(".")) {
    const parts = ruleId.split(".");
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  }
  return undefined;
}
