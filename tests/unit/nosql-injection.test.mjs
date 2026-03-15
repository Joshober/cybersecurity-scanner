// $where and $expr with user input are dangerous; normal find() with literals is fine.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("nosql-injection", () => {
  it("vulnerable: $where flagged", () => {
    assertHasRuleId(
      scanSource("db.find({ $where: 'this.name === \\'x\\'' });"),
      "injection.noql"
    );
  });
  it("safe: plain find without $where not flagged", () => {
    assertNoRuleId(
      scanSource("db.find({ name: 'alice' });"),
      "injection.noql"
    );
  });
});
