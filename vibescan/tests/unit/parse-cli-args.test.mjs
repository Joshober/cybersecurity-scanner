import { describe, it } from "node:test";
import assert from "node:assert";
import { parseCliArgs } from "../../dist/system/cli/parseArgs.js";

describe("CLI argument parsing", () => {
  it("defaults to scan current directory when only flags are provided", () => {
    const parsed = parseCliArgs(["--format", "json", "--no-injection"]);
    assert.strictEqual(parsed.subcommand, "scan");
    assert.deepStrictEqual(parsed.inputPaths, ["."]);
  });

  it("keeps empty invocation as help-compatible (no implicit scan)", () => {
    const parsed = parseCliArgs([]);
    assert.strictEqual(parsed.subcommand, "");
    assert.deepStrictEqual(parsed.inputPaths, []);
  });

  it("fills scan path with current directory when scan is explicit", () => {
    const parsed = parseCliArgs(["scan", "--severity", "error"]);
    assert.strictEqual(parsed.subcommand, "scan");
    assert.deepStrictEqual(parsed.inputPaths, ["."]);
  });
});
