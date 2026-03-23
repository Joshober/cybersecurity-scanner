import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("MW-003 (missing helmet) app-level audit", () => {
  it("vulnerable: Express routes present, no helmet() call", () => {
    assertHasRuleId(
      scanSource(
        `const express = require("express"); const app = express(); app.get("/q", (req, res) => { res.send("ok"); });`
      ),
      "MW-003"
    );
  });

  it("safe: helmet() call present", () => {
    assertNoRuleId(
      scanSource(
        `const express = require("express"); const helmet = require("helmet"); const app = express(); app.use(helmet()); app.get("/q", (req, res) => { res.send("ok"); });`
      ),
      "MW-003"
    );
  });
});

