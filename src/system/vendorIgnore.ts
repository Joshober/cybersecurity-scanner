/** Default globs skipped when excludeVendor is enabled (CLI or config). */
export const VENDOR_EXCLUDE_GLOBS: string[] = [
  "**/node_modules/**",
  "**/vendor/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/coverage/**",
  "**/*.min.js",
  "**/*.min.mjs",
  "**/*.min.cjs",
  "**/*.bundle.js",
  "**/*.bundle.mjs",
  "**/cdn/**",
  "**/third_party/**",
  "**/third-party/**",
];

/** True if an absolute file path should be excluded (mirrors VENDOR_EXCLUDE_GLOBS). */
export function pathMatchesVendorExclude(resolvedPath: string): boolean {
  const p = resolvedPath.replace(/\\/g, "/");
  if (p.includes("/node_modules/")) return true;
  if (p.includes("/vendor/") || /\/vendor$/i.test(p)) return true;
  if (p.includes("/dist/")) return true;
  if (p.includes("/build/")) return true;
  if (p.includes("/.git/")) return true;
  if (p.includes("/coverage/")) return true;
  if (p.includes("/cdn/")) return true;
  if (p.includes("/third_party/") || p.includes("/third-party/")) return true;
  if (/\.min\.(js|mjs|cjs)$/i.test(p)) return true;
  if (/\.bundle\.(js|mjs)$/i.test(p)) return true;
  return false;
}
