import { describe, it } from "node:test";
import assert from "node:assert";
import { formatProjectSarif } from "../../dist/system/sarif.js";

describe("SARIF proof properties", () => {
  it("embeds vibescanProofFailureCode when proofGeneration has failureCode", () => {
    const project = {
      fileResults: [],
      routes: [],
      findings: [
        {
          ruleId: "demo.rule",
          message: "x",
          severity: "warning",
          severityLabel: "MEDIUM",
          category: "injection",
          line: 1,
          column: 0,
          filePath: "/a.js",
          proofGeneration: {
            status: "unsupported",
            wasGenerated: false,
            autoFilled: [],
            manualNeeded: [],
            generatorId: "g",
            failureCode: "unresolved_import",
            failureReason: "could not resolve module",
          },
        },
      ],
    };
    const sarif = JSON.parse(formatProjectSarif(project));
    const props = sarif.runs[0].results[0].properties;
    assert.strictEqual(props.vibescanProofFailureCode, "unresolved_import");
    assert.ok(props.vibescanProofFailureReason.includes("resolve"));
  });
});
