// Weak JWT / secret literals (checklist tiers).

export const TIER1_SECRETS = [
  "secret",
  "SECRET",
  "secret key",
  "123456",
  "your-256-bit-secret",
  "keyboard cat",
  "supersecretkey",
  "supersecretjwt",
  "your-secret-key-change-it-in-production",
  "changeme",
  "password",
  "mysecret",
  "jwt_secret",
  "secretkey",
  "your-secret-key",
  "development",
  "test-secret",
  "placeholder",
] as const;

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
] as const;

export const ALL_SECRETS = new Set<string>([...TIER1_SECRETS, ...TIER2_SECRETS]);
