// DES, RC4 and other weak ciphers get flagged; AES-GCM is considered safe.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("weak-ciphers", () => {
  it("vulnerable: DES/RC4 flagged", () => {
    assertHasRuleId(
      scanSource("const c=require('crypto'); c.createCipheriv('des', key, iv);"),
      "crypto.cipher.weak"
    );
  });
  it("safe: AES-GCM not flagged as weak", () => {
    assertNoRuleId(
      scanSource("const c=require('crypto'); c.createCipheriv('aes-256-gcm', key, iv);"),
      "crypto.cipher.weak"
    );
  });
});
