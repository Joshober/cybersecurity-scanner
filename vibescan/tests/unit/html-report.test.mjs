import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml, projectJsonToHtmlReport, buildHtmlReport } from "../../dist/system/htmlReport.js";

test("escapeHtml escapes markup", () => {
  assert.equal(escapeHtml(`<script>alert(1)</script>`), "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("projectJsonToHtmlReport renders summary and finding row", () => {
  const json = JSON.stringify({
    summary: {
      totalFindings: 1,
      bySeverity: { critical: 1, error: 0, warning: 0, info: 0 },
      byRuleId: { "RULE-X": 1 },
      byCategory: { crypto: 1, injection: 0, api_inventory: 0 },
      proofCoverage: {
        total_findings: 1,
        provable: 0,
        partial: 0,
        structural: 0,
        detection_only: 1,
        proof_coverage_percent: 0,
        deterministic_proof_percent: 0,
        by_tier: { tier_1: 0, tier_2: 0, tier_3: 0, tier_4: 1 },
        proof_pipeline_not_run: true,
      },
    },
    findings: [
      {
        ruleId: "RULE-X",
        message: "Test finding",
        severity: "critical",
        severityLabel: "CRITICAL",
        category: "crypto",
        file: "app.js",
        line: 10,
        cwe: 327,
      },
    ],
  });
  const html = projectJsonToHtmlReport(json);
  assert.match(html, /RULE-X/);
  assert.match(html, /Test finding/);
  assert.match(html, /CWE-327/);
  assert.match(html, /vibescan-data|filter-sev/); // interactive controls present
  assert.match(html, /Proof coverage/);
});

test("buildHtmlReport empty findings", () => {
  const html = buildHtmlReport({
    findings: [],
    summary: {
      totalFindings: 0,
      bySeverity: { critical: 0, error: 0, warning: 0, info: 0 },
      byRuleId: {},
      byCategory: { crypto: 0, injection: 0, api_inventory: 0 },
    },
  });
  assert.match(html, /0 finding/);
});
