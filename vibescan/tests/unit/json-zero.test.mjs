import { describe, it } from "node:test";
import assert from "node:assert";
import { formatProjectJson } from "../../dist/system/format.js";

describe("formatProjectJson empty findings", () => {
  it("emits summary with zero totals", () => {
    const project = {
      fileResults: [],
      routes: [],
      findings: [],
      packageJsonPath: undefined,
    };
    const j = JSON.parse(formatProjectJson(project));
    assert.strictEqual(j.summary.totalFindings, 0);
    assert.strictEqual(j.summary.bySeverity.critical, 0);
    assert.deepStrictEqual(j.findings, []);
  });
});
