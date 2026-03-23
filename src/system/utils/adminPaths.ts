/** High-privilege URL segments — missing auth here is especially risky. */
const ADMIN_PATH_PATTERNS: RegExp[] = [
  /\/admin(?:\/|$)/i,
  /\/moderator(?:\/|$)/i,
  /\/mod(?:\/|$)/i,
  /\/reports?(?:\/|$)/i,
  /\/ban(?:\/|$)/i,
  /\/suspend(?:\/|$)/i,
  /\/delete-user/i,
  /\/delete_user/i,
];

export function isAdminSensitivePath(fullPath: string): boolean {
  return ADMIN_PATH_PATTERNS.some((re) => re.test(fullPath));
}
