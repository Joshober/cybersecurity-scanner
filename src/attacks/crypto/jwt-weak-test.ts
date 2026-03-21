import { TIER1_SECRETS } from "./secretDict.js";

/** Config for generated JWT weak-secret tests. */
export const JWT_WEAK_SECRET_TEST = {
  algorithm: "HS256" as const,
  testSecrets: [...TIER1_SECRETS],
  forgedPayload: { role: "admin", isAdmin: true } as Record<string, unknown>,
};
