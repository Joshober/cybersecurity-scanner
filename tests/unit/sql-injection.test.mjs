// String concat and tainted data in SQL get flagged; parameterized queries don't.

import { describe, it } from "node:test";
import { scanSource, scanFixture, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("sql-injection", () => {
  it("vulnerable: string concat in query flagged", () => {
    assertHasRuleId(
      scanSource("db.query('SELECT * FROM users WHERE id=' + id);"),
      "sql"
    );
  });
  it("vulnerable: tainted flow to query flagged (fixture)", () => {
    assertHasRuleId(scanFixture("sql-injection/vulnerable.js"), "sql");
  });
  it("safe: parameterized query not flagged", () => {
    const r = scanSource(`
      function handler(req, res) {
        const id = req.query.id;
        db.query("SELECT * FROM users WHERE id = ?", [id]);
      }
    `);
    assertNoRuleId(r, "sql.string-concat");
    assertNoRuleId(r, "sql.tainted-flow");
  });
});
