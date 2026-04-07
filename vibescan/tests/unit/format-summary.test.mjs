// JSON summary, file field, zero-findings shape.

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  summarizeFindings,
  summarizeProofCoverageByRuleFamily,
  formatProjectJson,
  findingToJson,
  sortFindingsStable,
} from "../../dist/system/format.js";
import { scanProject } from "../../dist/system/scanner.js";

describe("summarizeFindings / formatProjectJson", () => {
  it("aggregates by severity, rule, and category", () => {
    const findings = [
      {
        ruleId: "a",
        message: "m",
        severity: "error",
        severityLabel: "HIGH",
        category: "crypto",
        line: 1,
        column: 0,
      },
      {
        ruleId: "a",
        message: "m2",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        line: 2,
        column: 0,
      },
      {
        ruleId: "b",
        message: "m3",
        severity: "error",
        severityLabel: "HIGH",
        category: "crypto",
        line: 3,
        column: 0,
      },
    ];
    const s = summarizeFindings(findings);
    assert.strictEqual(s.totalFindings, 3);
    assert.strictEqual(s.bySeverity.error, 2);
    assert.strictEqual(s.bySeverity.warning, 1);
    assert.strictEqual(s.byRuleId.a, 2);
    assert.strictEqual(s.byRuleId.b, 1);
    assert.strictEqual(s.byCategory.crypto, 2);
    assert.strictEqual(s.byCategory.injection, 1);
  });

  it("formatProjectJson includes summary and file on findings", () => {
    const source = `const x = require('crypto'); const h = crypto.createHash('md5');`;
    const project = scanProject([{ path: "sample.js", source }], {});
    const json = JSON.parse(formatProjectJson(project));
    assert.ok(json.summary);
    assert.strictEqual(typeof json.summary.totalFindings, "number");
    assert.ok(json.summary.byRuleId);
    assert.ok(json.summary.bySeverity);
    assert.ok(json.summary.byCategory);
    if (json.findings.length > 0) {
      const f = json.findings[0];
      assert.ok("file" in f);
    }
    assert.ok("thirdPartySurface" in json);
  });

  it("formatProjectJson includes route on middleware audit findings", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/api/login', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const json = JSON.parse(formatProjectJson(project));
    const auth = json.findings.find((f) => f.ruleId === "AUTH-003");
    assert.ok(auth, "expected AUTH-003 for sensitive /login path");
    assert.ok(auth.route);
    assert.strictEqual(auth.route.fullPath, "/api/login");
    assert.ok(Array.isArray(auth.route.middlewares));
  });

  it("findingToJson sets file from fallback", () => {
    const row = findingToJson(
      {
        ruleId: "x",
        message: "y",
        severity: "info",
        severityLabel: "LOW",
        category: "injection",
        line: 5,
        column: 0,
      },
      "/app/routes.js"
    );
    assert.strictEqual(row.file, "/app/routes.js");
  });

  it("formatProjectJson sorts findings deterministically by path, line, ruleId", () => {
    const project = {
      fileResults: [],
      routes: [],
      findings: [
        {
          ruleId: "z",
          message: "m2",
          severity: "warning",
          severityLabel: "MEDIUM",
          category: "injection",
          line: 2,
          column: 0,
          filePath: "/b.js",
        },
        {
          ruleId: "a",
          message: "m1",
          severity: "error",
          severityLabel: "HIGH",
          category: "crypto",
          line: 1,
          column: 0,
          filePath: "/a.js",
        },
      ],
    };
    const json = JSON.parse(formatProjectJson(project));
    assert.strictEqual(json.findings[0].filePath, "/a.js");
    assert.strictEqual(json.findings[1].filePath, "/b.js");
  });

  it("sortFindingsStable matches formatProjectJson order", () => {
    const findings = [
      { ruleId: "b", message: "", severity: "info", severityLabel: "LOW", category: "crypto", line: 1, filePath: "z.js" },
      { ruleId: "a", message: "", severity: "info", severityLabel: "LOW", category: "crypto", line: 1, filePath: "a.js" },
    ];
    const sorted = sortFindingsStable(findings);
    const json = JSON.parse(
      formatProjectJson({ findings, fileResults: [], routes: [] })
    );
    assert.deepStrictEqual(
      json.findings.map((f) => f.ruleId),
      sorted.map((f) => f.ruleId)
    );
  });

  it("summarizeProofCoverageByRuleFamily buckets unclassified and per-family tiers", () => {
    const findings = [
      {
        ruleId: "crypto.hash.weak",
        message: "m",
        severity: "error",
        severityLabel: "HIGH",
        category: "crypto",
        line: 1,
        column: 0,
        proofGeneration: {
          status: "provable_locally",
          wasGenerated: true,
          generatorId: "g",
          autoFilled: [],
          manualNeeded: [],
        },
      },
      {
        ruleId: "UNKNOWN-XYZ",
        message: "u",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "injection",
        line: 2,
        column: 0,
      },
    ];
    const byFam = summarizeProofCoverageByRuleFamily(findings);
    assert.ok(byFam["crypto.hash"]);
    assert.strictEqual(byFam["crypto.hash"].total_findings, 1);
    assert.strictEqual(byFam["crypto.hash"].provable, 1);
    assert.ok(byFam.unclassified);
    assert.strictEqual(byFam.unclassified.total_findings, 1);
  });

  it("formatProjectJson includes proofCoverageByRuleFamily in summary", () => {
    const project = {
      fileResults: [],
      routes: [],
      findings: [
        {
          ruleId: "crypto.hash.weak",
          message: "w",
          severity: "error",
          severityLabel: "HIGH",
          category: "crypto",
          line: 1,
          column: 0,
        },
      ],
    };
    const json = JSON.parse(formatProjectJson(project));
    assert.ok(json.summary.proofCoverageByRuleFamily);
    assert.ok(json.summary.proofCoverageByRuleFamily["crypto.hash"]);
  });

  it("formatProjectJson benchmarkMetadata adds run, findingsPerFile, ruleFamily", () => {
    const project = {
      fileResults: [],
      routes: [],
      findings: [
        {
          ruleId: "crypto.hash.weak",
          message: "weak",
          severity: "error",
          severityLabel: "HIGH",
          category: "crypto",
          line: 3,
          column: 1,
          filePath: "/x.js",
        },
      ],
    };
    const json = JSON.parse(
      formatProjectJson(project, {
        benchmarkMetadata: true,
        includeRuleFamily: true,
        toolVersion: "9.9.9-test",
        gitCommit: "deadbeef",
        scanOptions: { format: "json" },
      })
    );
    assert.ok(json.run);
    assert.strictEqual(json.run.toolVersion, "9.9.9-test");
    assert.strictEqual(json.run.gitCommit, "deadbeef");
    assert.ok(json.run.timestamp);
    assert.deepStrictEqual(json.summary.findingsPerFile, { "/x.js": 1 });
    assert.strictEqual(json.findings[0].ruleFamily, "crypto.hash");
  });

  it("formatProjectJson serializes thirdPartySurface when present", () => {
    const project = {
      fileResults: [],
      routes: [],
      findings: [],
      thirdPartySurface: {
        summary: {
          packageCount: 1,
          importEdgeCount: 1,
          routeTouchpointCount: 1,
          sensitiveRouteTouchpointCount: 1,
          findingTouchpointCount: 0,
          taintedFlowTouchpointCount: 0,
          reviewFindingCount: 1,
        },
        imports: [
          {
            filePath: "/app.js",
            packageName: "axios",
            moduleSpecifier: "axios",
            line: 1,
            dependencyKind: "dependency",
            specifiers: [{ kind: "default", localName: "axios", importedName: "default" }],
            importedBindings: ["axios"],
            usageCount: 1,
            callCount: 1,
          },
        ],
        packages: [
          {
            packageName: "axios",
            dependencyKinds: ["dependency"],
            files: ["/app.js"],
            importedBindings: ["axios"],
            importEdges: [],
            routeTouchpoints: [],
            findingTouchpoints: [],
            riskLabels: ["sensitive_route"],
            highestSeverity: "warning",
          },
        ],
        reviewFindings: [
          {
            ruleId: "third_party.route.sensitive-touchpoint",
            message: "Sensitive route touches external package \"axios\".",
            severity: "warning",
            severityLabel: "MEDIUM",
            category: "third_party",
            line: 5,
            column: 0,
            filePath: "/app.js",
          },
        ],
      },
    };
    const json = JSON.parse(formatProjectJson(project));
    assert.ok(json.thirdPartySurface);
    assert.strictEqual(json.thirdPartySurface.summary.packageCount, 1);
    assert.strictEqual(json.thirdPartySurface.packages[0].packageName, "axios");
  });
});
