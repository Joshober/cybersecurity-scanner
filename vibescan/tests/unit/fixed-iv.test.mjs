// All-zero or hardcoded IVs get flagged; using a random IV per encryption is ok.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("fixed-iv", () => {
  it("vulnerable: all-zero IV flagged", () => {
    assertHasRuleId(
      scanSource("const crypto=require('crypto'); crypto.createCipheriv('aes-256-gcm', key, '0000000000000000');"),
      "crypto.cipher.fixed-iv"
    );
  });
  it("safe: random IV not flagged", () => {
    assertNoRuleId(
      scanSource("const crypto=require('crypto'); const iv=crypto.randomBytes(16); crypto.createCipheriv('aes-256-gcm', key, iv);"),
      "crypto.cipher.fixed-iv"
    );
  });
});
