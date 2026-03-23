import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("crypto.jwt.weak-secret-literal", () => {
  it('vulnerable: jwt.sign with dictionary secret literal ("secret")', () => {
    assertHasRuleId(
      scanSource(
        `const jwt = require("jsonwebtoken"); jwt.sign({ a: 1 }, "secret");`
      ),
      "crypto.jwt.weak-secret-literal"
    );
  });

  it("safe: jwt.sign with likely-real provider token format", () => {
    assertNoRuleId(
      scanSource(
        `const jwt = require("jsonwebtoken"); jwt.sign({ a: 1 }, "AKIA1234567890ABCDEF");`
      ),
      "crypto.jwt.weak-secret-literal"
    );
  });
});

