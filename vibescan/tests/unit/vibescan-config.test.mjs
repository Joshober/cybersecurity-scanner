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

  it("merges TypeScript semantic analysis options", () => {
    const m = mergeVibeScanConfig(
      { tsAnalysis: "auto", tsconfigPath: "configs/tsconfig.json", tsFailOpen: true },
      {
        formatSet: false,
        excludeVendorSet: false,
        rulesSet: false,
        severitySet: false,
        checkRegistrySet: false,
        skipRegistrySet: false,
        ignoreGlobsSet: false,
        openApiSpecPathsSet: false,
        openApiDiscoverySet: false,
        buildIdSet: false,
        baselineSet: false,
        tsAnalysis: "semantic",
        tsAnalysisSet: true,
        tsconfigPath: "scan.tsconfig.json",
        tsconfigPathSet: true,
        tsFailOpen: false,
        tsFailOpenSet: true,
      },
      { crypto: true, injection: true }
    );
    assert.strictEqual(m.scanner.tsAnalysis, "semantic");
    assert.strictEqual(m.scanner.tsconfigPath, "scan.tsconfig.json");
    assert.strictEqual(m.scanner.tsFailOpen, false);
  });
});
