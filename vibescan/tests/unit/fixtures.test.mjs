// Smoke tests: scanner runs on fixture files (path resolution and scan pipeline).
// Full fixture coverage lives in per-rule tests (e.g. sql-injection.test.mjs, weak-hashing.test.mjs).

import { describe, it } from "node:test";
import { scanFixture, assertHasRuleId, assertNoHighSeverity } from "../helpers.mjs";

describe("Fixtures (smoke)", () => {
  it("vulnerable fixture produces findings", () => {
    assertHasRuleId(scanFixture("sql-injection/vulnerable.js"), "sql");
  });
  it("safe fixture has no high-severity findings", () => {
    assertNoHighSeverity(scanFixture("safe/safe.mjs"));
  });
});
