// Turning off cert verification (rejectUnauthorized: false) gets flagged; leaving it on is fine.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("disabled-tls", () => {
  it("vulnerable: rejectUnauthorized: false flagged", () => {
    assertHasRuleId(
      scanSource("const opts = { rejectUnauthorized: false };"),
      "crypto.tls"
    );
  });
  it("safe: rejectUnauthorized not false not flagged", () => {
    assertNoRuleId(
      scanSource("const opts = { rejectUnauthorized: true };"),
      "crypto.tls"
    );
  });
});
