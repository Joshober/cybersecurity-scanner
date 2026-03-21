// The old createCipher/createDecipher APIs get flagged; createCipheriv is the right one to use.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("deprecated-ciphers", () => {
  it("vulnerable: createCipher flagged", () => {
    assertHasRuleId(
      scanSource("const crypto=require('crypto'); crypto.createCipher('aes256', key);"),
      "crypto.cipher.deprecated"
    );
  });
  it("safe: createCipheriv not deprecated", () => {
    assertNoRuleId(
      scanSource("const c=require('crypto'); c.createCipheriv('aes-256-gcm', key, iv);"),
      "crypto.cipher.deprecated"
    );
  });
});
