// Running shell commands with user input is dangerous; the scanner flags it. Literal commands are fine.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("command-injection", () => {
  it("vulnerable: shell command from template literal flagged", () => {
    assertHasRuleId(
      scanSource("const cp = require('child_process'); cp.execSync(`ls ${dir}`);"),
      "injection.command"
    );
  });
  it("safe: literal command not flagged", () => {
    assertNoRuleId(
      scanSource("const cp = require('child_process'); cp.execSync('ls');"),
      "injection.command"
    );
  });
});
