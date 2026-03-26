// Math.random() is not safe for security-sensitive values; the scanner flags it. crypto.randomBytes is ok.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("insecure-randomness", () => {
  it("vulnerable: Math.random() flagged", () => {
    assertHasRuleId(
      scanSource("const token = Math.random().toString(36);"),
      "crypto.random"
    );
  });
  it("safe: crypto.randomBytes not flagged", () => {
    assertNoRuleId(
      scanSource("const token = require('crypto').randomBytes(32).toString('hex');"),
      "crypto.random"
    );
  });
});
