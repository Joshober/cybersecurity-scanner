// Building XPath from user input is risky; the scanner flags it. Literal XPath is fine.
// Pattern rule (injection.xpath) + taint (injection.xpath.tainted-flow) both cover this.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("xpath-injection", () => {
  it("vulnerable: dynamic expression flagged (pattern)", () => {
    assertHasRuleId(
      scanSource("document.evaluate(expr, doc, null, 0, null);"),
      "injection.xpath"
    );
  });
  it("vulnerable: tainted req.query flows to document.evaluate (taint)", () => {
    const code = `
      const expr = req.query.x;
      document.evaluate(expr, doc, null, 0, null);
    `;
    assertHasRuleId(scanSource(code), "injection.xpath");
  });
  it("safe: literal XPath not flagged", () => {
    assertNoRuleId(
      scanSource("document.evaluate('//div', doc, null, 0, null);"),
      "injection.xpath"
    );
  });
});
