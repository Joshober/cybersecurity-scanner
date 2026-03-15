// default-secret-fallback: process.env.X || 'default' flagged; no fallback not.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("default-secret-fallback", () => {
  it("vulnerable: process.env.X || 'default' flagged", () => {
    assertHasRuleId(
      scanSource("const secret = process.env.SECRET || 'devsecret';"),
      "crypto.secrets.env-fallback"
    );
  });
  it("safe: no fallback not flagged", () => {
    assertNoRuleId(
      scanSource("const secret = process.env.SECRET;"),
      "crypto.secrets.env-fallback"
    );
  });
});
