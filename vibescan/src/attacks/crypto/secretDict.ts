/**
 * Tiered weak-secret dictionary for LLM / tutorial defaults (VibeScan research).
 *
 * Sources (summarize in paper; URLs current as of collection):
 * - jsonwebtoken README examples (HS256 + literal secrets, e.g. "secret", "shhhhh").
 * - express-session / connect examples ("keyboard cat", "secret").
 * - Truffle Security — JWT cracking / weak secret research (common human-chosen passwords
 *   and framework demo strings). https://trufflesecurity.com/blog/jwt-keys (and related posts).
 * - Invicti 20k AI-generated app study — repeated literals such as supersecretkey,
 *   supersecretjwt, your-secret-key, etc.
 *
 * Tier 2 adds model- and boilerplate-style placeholders seen in generated repos (Invicti-style
 * and generic tutorial names), not necessarily from a single vendor doc.
 */

export {
  shannonEntropy,
  isLikelyRealSecret,
  PROVIDER_PATTERNS,
} from "./entropy.js";

/** Doc-derived and JWT-study literals (Tier 1). */
export const TIER1_SECRETS = [
  "secret",
  "SECRET",
  "shhhhh",
  "shhhhhh",
  "secret key",
  "123456",
  "123456789",
  "your-256-bit-secret",
  "keyboard cat",
  "keyboardcat",
  "supersecretkey",
  "supersecretjwt",
  "your-secret-key-change-it-in-production",
  "changeme",
  "password",
  "Password123",
  "mysecret",
  "jwt_secret",
  "JWT_SECRET",
  "secretkey",
  "your-secret-key",
  "development",
  "dev-secret",
  "test-secret",
  "testsecret",
  "placeholder",
  "replace_me",
  "node.js",
] as const;

/** AI-generated / boilerplate-style placeholders (Tier 2). */
export const TIER2_SECRETS = [
  "SESSION_SECRET",
  "TOKEN_SECRET",
  "APP_SECRET",
  "auth_secret",
  "my-secret",
  "example-secret",
  "dummy",
  "default",
  "hackme",
  "replace-this",
  "todo",
  "fixme",
  "admin",
  "root",
  "pass",
  "qwerty",
  "letmein",
  "welcome",
  "iloveyou",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "whatever",
  "trustno1",
  "access",
  "mustang",
  "shadow",
  "michael",
  "jennifer",
  "jordan",
  "harley",
  "ranger",
  "buster",
  "thomas",
  "tigger",
  "robert",
  "soccer",
  "batman",
  "test",
  "guest",
  "info",
  "adm",
  "mysql",
  "oracle",
  "postgres",
  "mongo",
  "redis",
  "apikey",
  "api_key",
  "privatekey",
  "publickey",
  "signing_key",
  "encryption_key",
] as const;

export const ALL_SECRETS = new Set<string>([...TIER1_SECRETS, ...TIER2_SECRETS]);
