// eval() and new Function() with user input get flagged; JSON.parse is ok.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("code-injection", () => {
  it("vulnerable: eval() flagged", () => {
    assertHasRuleId(scanSource("eval(userInput);"), "injection.eval");
  });
  it("vulnerable: new Function() flagged", () => {
    assertHasRuleId(scanSource("const fn = new Function('return 1');"), "injection.eval");
  });
  it("safe: JSON.parse not flagged", () => {
    assertNoRuleId(scanSource("const x = JSON.parse(str);"), "injection.eval");
  });
});
