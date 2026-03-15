// Catches API keys and passwords hardcoded in source; using env vars is fine.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("hardcoded-secrets", () => {
  it("vulnerable: apiKey literal flagged", () => {
    assertHasRuleId(
      scanSource("const config = { apiKey: 'sk_live_1234567890abcdef' };"),
      "crypto.secrets.hardcoded"
    );
  });
  it("safe: env var not flagged", () => {
    assertNoRuleId(
      scanSource("const apiKey = process.env.API_KEY;"),
      "crypto.secrets.hardcoded"
    );
  });
});
