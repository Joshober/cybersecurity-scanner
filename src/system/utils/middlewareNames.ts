export const AUTH_MIDDLEWARE = [
  "passport.authenticate",
  "verifyToken",
  "requireAuth",
  "isAuthenticated",
  "jwt.verify",
  "authMiddleware",
  "authenticate",
  "protect",
  "ensureAuth",
] as const;

export const CSRF_MIDDLEWARE = [
  "csrf",
  "csurf",
  "doubleCsrf",
  "lusca.csrf",
  "csrfProtection",
] as const;

export const RATE_LIMIT_MIDDLEWARE = [
  "rateLimit",
  "expressRateLimit",
  "limiter",
  "rateLimiter",
  "slowDown",
  "bottleneck",
] as const;

export const HELMET_NAMES = new Set(["helmet", "helmet.hsts", "helmet.contentSecurityPolicy"]);

export function chainMatchesList(haystack: string[], needles: readonly string[]): boolean {
  return haystack.some((h) =>
    needles.some((n) => h === n || h.includes(n) || n.includes(h))
  );
}
