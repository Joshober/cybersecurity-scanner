import { describe, it } from "node:test";
import assert from "node:assert";
import { proofGenerators } from "../../dist/system/proof/registry.js";
import { jwtWeakSecretGenerator } from "../../dist/system/proof/generators/jwtWeakSecret.js";
import { prototypePollutionGenerator } from "../../dist/system/proof/generators/prototypePollution.js";
import { injectionTaintFlowGenerator } from "../../dist/system/proof/generators/injectionTaintFlow.js";
import { commonStaticPatternProofGenerator } from "../../dist/system/proof/generators/commonStaticPatternProof.js";

describe("proofGenerators registry", () => {
  it("has deterministic order and unique ids", () => {
    const ids = proofGenerators.map((g) => g.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.ok(ids.includes("openapi.route_contract"));
    assert.ok(ids.includes("jwt.weak_secret"));
    assert.ok(ids.includes("prototype.pollution"));
    assert.ok(ids.includes("taint.injection_sink"));
    assert.ok(ids.includes("pattern.injection_crypto_static"));
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

  it("injection taint generator requires sql/orm rule id and taint labels", () => {
    assert.strictEqual(
      injectionTaintFlowGenerator.supports({
        ruleId: "injection.orm.request-in-query",
        message: "x",
        severity: "error",
        severityLabel: "HIGH",
        category: "injection",
        line: 1,
        column: 0,
        sourceLabel: "req.body.login",
        sinkLabel: "sequelize.where",
      }),
      true
    );
    assert.strictEqual(
      injectionTaintFlowGenerator.supports({
        ruleId: "injection.orm.request-in-query",
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

  it("static pattern generator supports DVNA-style rule ids", () => {
    assert.strictEqual(
      commonStaticPatternProofGenerator.supports({
        ruleId: "injection.sql.string-concat",
        message: "x",
        severity: "error",
        severityLabel: "HIGH",
        category: "injection",
        line: 1,
        column: 0,
      }),
      true
    );
    assert.strictEqual(
      commonStaticPatternProofGenerator.supports({
        ruleId: "injection.orm.request-in-query",
        message: "x",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        line: 1,
        column: 0,
      }),
      true
    );
    assert.strictEqual(
      commonStaticPatternProofGenerator.supports({
        ruleId: "SEC-004",
        message: "fallback",
        findingKind: "ENV_FALLBACK",
        severity: "critical",
        severityLabel: "CRITICAL",
        category: "crypto",
        line: 1,
        column: 0,
      }),
      true
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
