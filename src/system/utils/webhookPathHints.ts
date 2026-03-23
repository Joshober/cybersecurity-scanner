/** Path substrings / patterns for webhook-style routes (shared by audits + inventory). */

const WEBHOOK_PATH_HINTS: RegExp[] = [
  /\/webhook/i,
  /\/webhooks/i,
  /\/stripe/i,
  /\/hooks\//i,
  /\/payments?\/callback/i,
];

export function isWebhookLikePath(fullPath: string): boolean {
  return WEBHOOK_PATH_HINTS.some((re) => re.test(fullPath));
}
