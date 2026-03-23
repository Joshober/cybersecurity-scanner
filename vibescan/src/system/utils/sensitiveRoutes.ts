export const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /\/login/i,
  /\/register/i,
  /\/signup/i,
  /\/auth/i,
  /\/token/i,
  /\/forgot-password/i,
  /\/reset-password/i,
  /\/password-reset/i,
  /\/password\/reset/i,
  /\/recover/i,
  /\/verify/i,
  /\/webhook/i,
  /\/webhooks/i,
  /\/hooks\//i,
  /\/upload/i,
  /\/report/i,
  /\/report-abuse/i,
  /\/abuse/i,
  /\/message/i,
  /\/messages/i,
  /\/messaging/i,
  /\/send/i,
];

export function isSensitivePath(fullPath: string): boolean {
  return SENSITIVE_PATH_PATTERNS.some((re) => re.test(fullPath));
}
