import { describe, it } from "node:test";
import assert from "node:assert";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runProofHarness } from "../../dist/system/proof/runner.js";

describe("proof harness runner", () => {
  it("runProofHarness executes node --test and records pass", () => {
    const dir = mkdtempSync(join(tmpdir(), "vibescan-proof-"));
    try {
      const testFile = join(dir, "sample.test.mjs");
      writeFileSync(
        testFile,
        `import { test } from 'node:test';
import assert from 'node:assert';
test('demo', () => assert.ok(true));
`,
        "utf-8"
      );
      const projectJson = join(dir, "project.json");
      writeFileSync(
        projectJson,
        JSON.stringify({
          findings: [
            {
              ruleId: "demo.rule",
              message: "demo",
              severity: "info",
              severityLabel: "LOW",
              category: "injection",
              file: "x.js",
              line: 1,
              column: 0,
              proofGeneration: {
                status: "provable_locally",
                wasGenerated: true,
                generatedPath: testFile,
                autoFilled: [],
                manualNeeded: [],
                generatorId: "demo",
              },
            },
          ],
        }),
        "utf-8"
      );
      const log = runProofHarness({ fromJson: projectJson });
      assert.strictEqual(log.summary.executed, 1);
      assert.strictEqual(log.summary.pass, 1);
      assert.strictEqual(log.entries[0].result, "pass");
      assert.ok(log.entries[0].durationMs >= 0);
    } finally {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    }
  });
});
