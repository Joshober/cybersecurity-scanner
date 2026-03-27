// IDE assist markdown (no API keys).

import { describe, it } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { buildIdeAssistMarkdown } from "../../dist/system/cli/ideAssistPrompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoVibescanRoot = join(__dirname, "../..");
const cliJs = join(repoVibescanRoot, "dist/system/cli/vibescan.js");

describe("buildIdeAssistMarkdown", () => {
  it("documents Cursor / Claude and denies remote API", () => {
    const md = buildIdeAssistMarkdown({
      projectRoot: "/proj",
      findings: [
        {
          ruleId: "injection.eval",
          severity: "error",
          message: "eval",
          line: 1,
          column: 0,
          severityLabel: "HIGH",
          category: "injection",
          filePath: "/proj/a.js",
        },
      ],
      scannedRelativePaths: ["a.js"],
    });
    assert.match(md, /Cursor/i);
    assert.match(md, /does not.*remote LLM API/s);
    assert.match(md, /injection\.eval/);
  });
});

describe("CLI --mode ai", () => {
  it("writes vibescan-ai-assist.md under project root", () => {
    const dir = mkdtempSync(join(tmpdir(), "vibescan-idea-"));
    try {
      const fixture = join(dir, "bad.js");
      writeFileSync(fixture, "eval(1)\n", "utf-8");
      const r = spawnSync(
        process.execPath,
        [cliJs, "scan", fixture, "--mode", "ai", "--project-root", dir, "--format", "json"],
        { encoding: "utf8" }
      );
      assert.strictEqual(r.status, 1, r.stderr);
      const outPath = join(dir, "vibescan-ai-assist.md");
      assert.ok(existsSync(outPath), r.stderr + r.stdout);
      const md = readFileSync(outPath, "utf8");
      assert.match(md, /IDE-assisted security review/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
