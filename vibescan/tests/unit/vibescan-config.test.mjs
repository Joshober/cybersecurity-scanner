import { describe, it } from "node:test";
import assert from "node:assert";
import { mergeVibeScanConfig } from "../../dist/system/cli/vibescanConfig.js";
import { applySuppressions } from "../../dist/system/suppress.js";

describe("vibescan config merge", () => {
  it("file sets format; CLI overrides", () => {
    const m = mergeVibeScanConfig(
      { format: "compact", excludeVendor: true, rules: { crypto: false } },
      { format: "json", formatSet: true, excludeVendorSet: false, rulesSet: false },
      { crypto: true, injection: true }
    );
    assert.strictEqual(m.format, "json");
    assert.strictEqual(m.scanner.excludeVendor, true);
    assert.strictEqual(m.scanner.crypto, false);
  });

  it("suppression drops matching ruleId", () => {
    const findings = [
      {
        ruleId: "MW-003",
        message: "x",
        severity: "info",
        severityLabel: "LOW",
        category: "injection",
        line: 1,
        column: 0,
        filePath: "/app/a.js",
      },
    ];
    const out = applySuppressions(findings, [{ ruleId: "MW-003" }]);
    assert.strictEqual(out.length, 0);
  });
});
