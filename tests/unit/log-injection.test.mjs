// The scanner flags when user input gets logged (log injection risk); plain string logs are fine.
// Pattern rule (injection.log) + taint (injection.log.tainted-flow) both cover this.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("log-injection", () => {
  it("vulnerable: dynamic log message flagged (pattern)", () => {
    assertHasRuleId(scanSource("console.log(userInput);"), "injection.log");
  });
  it("vulnerable: tainted req.body flows to console.log (taint)", () => {
    const code = `
      const msg = req.body.msg;
      console.log(msg);
    `;
    assertHasRuleId(scanSource(code), "injection.log");
  });
  it("safe: literal log message not flagged", () => {
    assertNoRuleId(scanSource("console.log('User logged in');"), "injection.log");
  });
});
