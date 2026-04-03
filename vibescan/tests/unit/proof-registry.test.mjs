import { describe, it } from "node:test";
import assert from "node:assert";
import { proofGenerators } from "../../dist/system/proof/registry.js";
import { jwtWeakSecretGenerator } from "../../dist/system/proof/generators/jwtWeakSecret.js";
import { prototypePollutionGenerator } from "../../dist/system/proof/generators/prototypePollution.js";

describe("proofGenerators registry", () => {
  it("has deterministic order and unique ids", () => {
    const ids = proofGenerators.map((g) => g.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.ok(ids.includes("openapi.route_contract"));
    assert.ok(ids.includes("jwt.weak_secret"));
    assert.ok(ids.includes("prototype.pollution"));
  });

  it("jwt generator supports crypto.jwt.weak-secret-literal only", () => {
    assert.strictEqual(
      jwtWeakSecretGenerator.supports({
        ruleId: "crypto.jwt.weak-secret-literal",
        message: "x",
        severity: "error",
        severityLabel: "HIGH",
        category: "crypto",
        line: 1,
        column: 0,
      }),
      true
    );
    assert.strictEqual(
      jwtWeakSecretGenerator.supports({
        ruleId: "injection.sql",
        message: "x",
        severity: "error",
        severityLabel: "HIGH",
        category: "injection",
        line: 1,
        column: 0,
      }),
      false
    );
  });

  it("prototype generator supports taint proto rule", () => {
    assert.strictEqual(
      prototypePollutionGenerator.supports({
        ruleId: "injection.prototype-pollution.tainted-flow",
        message: "x",
        severity: "error",
        severityLabel: "HIGH",
        category: "injection",
        line: 1,
        column: 0,
      }),
      true
    );
  });
});
