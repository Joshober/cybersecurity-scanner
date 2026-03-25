import { describe, it } from "node:test";
import assert from "node:assert";
import { buildFixAssistantPrompt } from "../../dist/system/fixPrompt.js";

describe("fix assistant prompt", () => {
  it("orders by severity and caps maxFindings", () => {
    const text = buildFixAssistantPrompt({
      projectLabel: "/proj",
      findings: [
        {
          ruleId: "a.info",
          message: "low",
          severity: "info",
          severityLabel: "LOW",
          category: "injection",
          line: 1,
          column: 1,
          filePath: "/p/x.js",
        },
        {
          ruleId: "b.critical",
          message: "bad",
          severity: "critical",
          severityLabel: "CRITICAL",
          category: "crypto",
          line: 2,
          column: 1,
          filePath: "/p/y.js",
          remediation: "Fix it",
        },
      ],
      maxFindings: 1,
    });
    assert.match(text, /b\.critical/);
    assert.ok(!text.includes("a.info"));
    assert.match(text, /VibeScan/);
  });
});
