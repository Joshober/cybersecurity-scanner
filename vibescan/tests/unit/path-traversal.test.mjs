// Variable paths in fs.readFile etc. can be path traversal; the scanner flags those. Literal paths are ok.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("path-traversal", () => {
  it("vulnerable: fs.readFile with variable path flagged", () => {
    assertHasRuleId(
      scanSource("const fs = require('fs'); fs.readFile(path, 'utf8', cb);"),
      "path-traversal"
    );
  });
  it("safe: literal path not flagged", () => {
    assertNoRuleId(
      scanSource("const fs = require('fs'); fs.readFile('/etc/config.json', 'utf8', cb);"),
      "path-traversal"
    );
  });
});
