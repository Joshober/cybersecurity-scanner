import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("mw.cookie.missing-flags", () => {
  it("vulnerable: res.cookie without options", () => {
    assertHasRuleId(
      scanSource(
        `const express = require("express"); const app = express(); app.get("/", (req, res) => { res.cookie("sid", "abc"); });`
      ),
      "mw.cookie.missing-flags"
    );
  });

  it("vulnerable: res.cookie with secure only (missing httpOnly)", () => {
    assertHasRuleId(
      scanSource(
        `const express = require("express"); const app = express(); app.get("/", (req, res) => { res.cookie("sid", "abc", { secure: true }); });`
      ),
      "mw.cookie.missing-flags"
    );
  });

  it("vulnerable: res.cookie with httpOnly only (missing secure)", () => {
    assertHasRuleId(
      scanSource(
        `const express = require("express"); const app = express(); app.get("/", (req, res) => { res.cookie("sid", "abc", { httpOnly: true }); });`
      ),
      "mw.cookie.missing-flags"
    );
  });

  it("safe: res.cookie with httpOnly=true and secure=true", () => {
    assertNoRuleId(
      scanSource(
        `const express = require("express"); const app = express(); app.get("/", (req, res) => { res.cookie("sid", "abc", { httpOnly: true, secure: true }); });`
      ),
      "mw.cookie.missing-flags"
    );
  });
});

