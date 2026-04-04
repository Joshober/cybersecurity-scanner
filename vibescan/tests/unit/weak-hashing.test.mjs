// MD5 and SHA-1 and the like get flagged for crypto; SHA-256 and up are fine.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("weak-hashing", () => {
  it("vulnerable: MD5 flagged", () => {
    assertHasRuleId(
      scanSource("const crypto=require('crypto'); crypto.createHash('md5').update(x).digest('hex');"),
      "crypto.hash.weak"
    );
  });
  it("vulnerable: md5 npm helper flagged", () => {
    assertHasRuleId(scanSource("const md5=require('md5'); md5(req.query.login);"), "crypto.hash.weak");
  });
  it("safe: SHA-256 not flagged", () => {
    assertNoRuleId(
      scanSource("const c=require('crypto'); c.createHash('sha256').update(x).digest('hex');"),
      "crypto.hash.weak"
    );
  });
});
