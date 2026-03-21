// XSS: innerHTML/document.write flagged; textContent not.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("xss", () => {
  it("vulnerable: innerHTML with dynamic content flagged", () => {
    assertHasRuleId(scanSource("el.innerHTML = userInput;"), "injection.xss");
  });
  it("vulnerable: document.write flagged", () => {
    assertHasRuleId(scanSource("document.write(msg);"), "injection.xss");
  });
  it("safe: textContent not flagged", () => {
    assertNoRuleId(scanSource("el.textContent = userInput;"), "injection.xss");
  });
});
