import test from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

test("crypto.jwt.weak-secret-verify", async (t) => {
  await t.test("vulnerable: jwt.verify with weak literal secret", () => {
    const src = `
      import jwt from "jsonwebtoken";
      export function verifyToken(token) {
        return jwt.verify(token, "secret");
      }
    `;
    const r = scanSource(src, "jwt-verify-vuln.js");
    assertHasRuleId(r, "crypto.jwt.weak-secret-verify");
  });

  await t.test("safe: jwt.verify with env secret", () => {
    const src = `
      import jwt from "jsonwebtoken";
      export function verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
      }
    `;
    const r = scanSource(src, "jwt-verify-safe.js");
    assertNoRuleId(r, "crypto.jwt.weak-secret-verify");
  });
});
