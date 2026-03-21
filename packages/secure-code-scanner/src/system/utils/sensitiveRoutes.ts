export const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /\/login/i,
  /\/register/i,
  /\/auth/i,
  /\/token/i,
  /\/forgot-password/i,
  /\/reset-password/i,
  /\/verify/i,
];

export function isSensitivePath(fullPath: string): boolean {
  return SENSITIVE_PATH_PATTERNS.some((re) => re.test(fullPath));
}
