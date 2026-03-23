import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("RULE-SSRF-002", () => {
  it("vulnerable: axios baseURL + user-controlled relative url (req.path)", () => {
    assertHasRuleId(
      scanSource(
        `const express = require("express"); const axios = require("axios"); const app = express(); app.get("/", (req, res) => { axios({ baseURL: "https://example.com", url: req.path }); res.send("ok"); });`
      ),
      "RULE-SSRF-002"
    );
  });

  it("safe: axios baseURL + constant url literal", () => {
    assertNoRuleId(
      scanSource(
        `const express = require("express"); const axios = require("axios"); const app = express(); app.get("/", (req, res) => { axios({ baseURL: "https://example.com", url: "/health" }); res.send("ok"); });`
      ),
      "RULE-SSRF-002"
    );
  });
});

