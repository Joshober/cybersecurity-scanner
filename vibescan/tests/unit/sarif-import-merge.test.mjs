import { describe, it } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { importSarifText } from "../../dist/system/importers/sarif/importSarif.js";
import { mergeSarifWithProjectScan } from "../../dist/system/importers/sarif/mergeSarifProject.js";

function minimalSarif(toolName, ruleId, messageText, uri, line) {
  return JSON.stringify({
    version: "2.1.0",
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: toolName,
            version: "1.0.0",
          },
        },
        results: [
          {
            ruleId,
            message: { text: messageText },
            level: "warning",
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri },
                  region: { startLine: line, startColumn: 1 },
                },
              },
            ],
          },
        ],
      },
    ],
  });
}

describe("SARIF import + rule map", () => {
  it("maps external rule id via ruleMap and sets mappedRuleId + display ruleId", () => {
    const text = minimalSarif("eslint", "no-eval-001", "no eval", "src/x.js", 3);
    const ruleMap = [{ tool: "eslint", ruleIdPrefix: "no-eval", mapToRuleId: "injection.code-eval" }];
    const r = importSarifText(text, "sarif-import", { ruleMap });
    assert.strictEqual(r.findings.length, 1);
    const f = r.findings[0];
    assert.strictEqual(f.ruleId, "injection.code-eval");
    assert.strictEqual(f.mappedRuleId, "injection.code-eval");
    assert.strictEqual(f.toolRuleId, "no-eval-001");
    assert.strictEqual(f.line, 3);
  });

  it("without map, prefixes source label to rule id", () => {
    const text = minimalSarif("bandit", "B100", "issue", "a.py", 1);
    const r = importSarifText(text, "custom-label");
    assert.strictEqual(r.findings[0].ruleId, "custom-label:B100");
    assert.strictEqual(r.findings[0].mappedRuleId, undefined);
  });
});

describe("SARIF merge with project scan", () => {
  it("appends import when no native finding at same location key", () => {
    const root = mkdtempSync(join(tmpdir(), "vs-sarif-merge-"));
    try {
      writeFileSync(join(root, "clean.js"), "// no findings\n", "utf-8");
      const sarifPath = join(root, "in.sarif");
      writeFileSync(
        sarifPath,
        minimalSarif("external-tool", "RULE-A", "imported", "clean.js", 1),
        "utf-8"
      );
      const out = mergeSarifWithProjectScan({ projectRoot: root, sarifPath });
      assert.strictEqual(out.nativeFindingsCount, 0);
      assert.strictEqual(out.importedTotal, 1);
      assert.strictEqual(out.importedAppended, 1);
      const j = JSON.parse(out.projectJson);
      assert.strictEqual(j.findings.length, 1);
      assert.ok(
        String(j.findings[0].ruleId).includes("RULE-A"),
        `expected imported rule id in SARIF row, got ${j.findings[0].ruleId}`
      );
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("drops import when file:line collides with a native finding", () => {
    const root = mkdtempSync(join(tmpdir(), "vs-sarif-merge-"));
    try {
      const appJs = join(root, "app.js");
      const body = `eval("x");\n`;
      writeFileSync(appJs, body, "utf-8");
      const sarifPath = join(root, "in.sarif");
      writeFileSync(
        sarifPath,
        minimalSarif("external-tool", "IMPORTED-RULE", "from sarif", appJs, 1),
        "utf-8"
      );
      const out = mergeSarifWithProjectScan({ projectRoot: root, sarifPath });
      assert.ok(out.nativeFindingsCount >= 1, "expected native finding on line 1");
      assert.strictEqual(out.importedTotal, 1);
      assert.strictEqual(out.importedAppended, 0);
      const j = JSON.parse(out.projectJson);
      const sarifPrefixed = j.findings.filter((f) => String(f.ruleId).startsWith("sarif-import:"));
      assert.strictEqual(sarifPrefixed.length, 0);
      assert.strictEqual(j.findings.length, out.nativeFindingsCount);
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });
});
