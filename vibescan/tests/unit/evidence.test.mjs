// Proof coverage summary, finding IDs, reproduce-related JSON fields.

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeFindingId,
  summarizeProofCoverage,
  proofCoverageTier,
} from "../../dist/system/evidence.js";
import { findingToJson, formatProjectJson } from "../../dist/system/format.js";
import { scanProject } from "../../dist/system/scanner.js";

describe("evidence / proof coverage", () => {
  it("computeFindingId is stable for the same finding fields", () => {
    const base = {
      ruleId: "injection.eval",
      message: "eval",
      severity: "error",
      severityLabel: "HIGH",
      category: "injection",
      line: 2,
      column: 0,
      filePath: "/proj/a.js",
    };
    assert.strictEqual(computeFindingId(base), computeFindingId(base));
    assert.ok(computeFindingId(base).startsWith("vs1-"));
  });

  it("summarizeProofCoverage counts tiers and sets proof_pipeline_not_run", () => {
    const withProof = {
      ruleId: "x",
      message: "m",
      severity: "error",
      severityLabel: "HIGH",
      category: "injection",
      line: 1,
      column: 0,
      proofGeneration: {
        status: "provable_locally",
        wasGenerated: true,
        autoFilled: [],
        manualNeeded: [],
        generatorId: "t",
      },
    };
    const s = summarizeProofCoverage([withProof]);
    assert.strictEqual(s.provable, 1);
    assert.strictEqual(s.by_tier.tier_1, 1);
    assert.strictEqual(s.proof_pipeline_not_run, false);

    const s2 = summarizeProofCoverage([
      { ...withProof, proofGeneration: undefined },
    ]);
    assert.strictEqual(s2.proof_pipeline_not_run, true);
  });

  it("proofTier 3 for unsupported AUTH route finding", () => {
    const f = {
      ruleId: "AUTH-003",
      message: "auth",
      severity: "warning",
      severityLabel: "MEDIUM",
      category: "injection",
      line: 1,
      column: 0,
      route: { method: "POST", path: "/x", fullPath: "/x", middlewares: [] },
      proofGeneration: {
        status: "unsupported",
        wasGenerated: false,
        autoFilled: [],
        manualNeeded: [],
        generatorId: "unsupported",
      },
    };
    assert.strictEqual(proofCoverageTier(f), 3);
  });

  it("formatProjectJson includes summary.proofCoverage and finding evidence fields", () => {
    const source = `const x = require('crypto'); const h = crypto.createHash('md5');`;
    const project = scanProject([{ path: "sample.js", source }], {});
    const json = JSON.parse(formatProjectJson(project));
    assert.ok(json.summary.proofCoverage);
    assert.strictEqual(typeof json.summary.proofCoverage.proof_coverage_percent, "number");
    assert.strictEqual(typeof json.summary.proofCoverage.deterministic_proof_percent, "number");
    if (json.findings.length > 0) {
      const row = json.findings[0];
      assert.ok(row.findingId);
      assert.ok(row.confidenceReason);
      assert.ok(row.confidenceReasons);
      assert.ok(Array.isArray(row.confidenceReasons));
      assert.ok(row.rootCause);
      assert.ok(row.causalGraph);
      assert.strictEqual(row.causalGraph.version, 1);
      assert.strictEqual(typeof row.proofTier, "number");
      assert.ok(row.proofTierLabel);
      assert.strictEqual(typeof row.deterministic, "boolean");
      assert.strictEqual(typeof row.proofReason, "string");
      assert.strictEqual(typeof row.confidenceScore, "number");
    }
  });

  it("findingToJson includes fixPreview when remediation exists and evidence on", () => {
    const row = findingToJson(
      {
        ruleId: "injection.eval",
        message: "eval use",
        remediation: "Remove eval; use safe parsing.",
        severity: "error",
        severityLabel: "HIGH",
        category: "injection",
        line: 1,
        column: 0,
        filePath: "/a.js",
      },
      undefined,
      false,
      false,
      true
    );
    assert.ok(row.fixPreview);
    assert.ok(row.fixPreview.remediation_hint);
  });
});
