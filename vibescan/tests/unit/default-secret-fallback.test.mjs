// default-secret-fallback: process.env.X || 'default' flagged; no fallback not.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("default-secret-fallback (SEC-004)", () => {
  it("vulnerable: process.env.X || weak dictionary literal flagged", () => {
    assertHasRuleId(
      scanSource("const secret = process.env.SECRET || 'changeme';"),
      "SEC-004"
    );
  });
  it("vulnerable: supersecretkey in dictionary flagged", () => {
    assertHasRuleId(
      scanSource("const s = process.env.JWT_SECRET || 'supersecretkey';"),
      "SEC-004"
    );
  });
  it("safe: high-entropy literal not flagged as weak fallback", () => {
    assertNoRuleId(
      scanSource("const s = process.env.JWT_SECRET || 'xK9#mP2$vL8nQ4@wR';"),
      "SEC-004"
    );
  });
  it("safe: non-literal fallback not flagged", () => {
    assertNoRuleId(
      scanSource("const s = process.env.JWT_SECRET || generateRandomSecret();"),
      "SEC-004"
    );
  });
  it("safe: no fallback not flagged", () => {
    assertNoRuleId(
      scanSource("const secret = process.env.SECRET;"),
      "SEC-004"
    );
  });
});
