// JSON summary, file field, zero-findings shape.

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  summarizeFindings,
  formatProjectJson,
  findingToJson,
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
});
