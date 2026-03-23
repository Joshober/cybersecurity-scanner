// Likely missing webhook HMAC / signature verification (Express route graph).

import type { Finding, RouteNode } from "../types.js";
import { isWebhookLikePath } from "../utils/webhookPathHints.js";
import { findingRouteFromNode } from "../utils/routeFindingMeta.js";

function handlerUsesBody(src: string): boolean {
  return /\breq\.body\b/.test(src) || /\brequest\.body\b/.test(src);
}

/** Heuristic tokens — absence elsewhere in handler source is inconclusive for split modules. */
function hasVerificationHints(src: string): boolean {
  const hints = [
    "constructEvent",
    "timingSafeEqual",
    "verifyWebhook",
    "stripe-signature",
    "x-hub-signature",
    "x-signature",
    "svix-signature",
    "webhooks.verify",
    "X-Webhook-Signature",
  ];
  const lower = src.toLowerCase();
  return hints.some((h) => lower.includes(h.toLowerCase()));
}

export function runWebhookAudit(routes: RouteNode[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of routes) {
    if (r.method !== "POST" && r.method !== "PUT") continue;
    if (!isWebhookLikePath(r.fullPath)) continue;
    const src = r.handlerSource;
    if (!handlerUsesBody(src)) continue;
    if (hasVerificationHints(src)) continue;
    findings.push({
      ruleId: "WEBHOOK-001",
      message: `Webhook-style route ${r.method} ${r.fullPath} may lack signature verification`,
      why: "Payment and integration webhooks should validate HMAC or provider signatures before trusting the body.",
      remediation: "Verify provider signatures (e.g. Stripe constructEvent) using the raw body and secret; use timing-safe comparison.",
      fix: "Verify provider signatures (e.g. Stripe constructEvent) using the raw body and secret; use timing-safe comparison.",
      cwe: 345,
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
  return findings;
}
