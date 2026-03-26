// Shared test helpers: scanSource, scanFixture, assertHasRuleId, assertNoRuleId, assertNoFindings, assertFindingCount, assertNoHighSeverity. Used by all tests/unit/*.test.mjs.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { scan } from "../dist/system/scanner.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "fixtures");
const defaultOptions = { crypto: true, injection: true };

export function scanFixture(name) {
  const path = join(FIXTURES, name);
  return scan(readFileSync(path, "utf-8"), path, defaultOptions);
}

export function scanSource(source, filename = "inline.js") {
  return scan(source, filename, defaultOptions);
}

export function assertHasRuleId(result, ruleIdOrSubstring) {
  const found = result.findings.some(
    (f) => f.ruleId === ruleIdOrSubstring || f.ruleId.includes(ruleIdOrSubstring)
  );
  assert.ok(found, `Expected a finding with ruleId containing "${ruleIdOrSubstring}". Got: ${result.findings.map((f) => f.ruleId).join(", ") || "none"}`);
}

export function assertNoRuleId(result, ruleIdOrSubstring) {
  const found = result.findings.filter(
    (f) => f.ruleId === ruleIdOrSubstring || f.ruleId.includes(ruleIdOrSubstring)
  );
  assert.strictEqual(found.length, 0, `Expected no finding with ruleId "${ruleIdOrSubstring}". Got: ${found.map((f) => f.ruleId).join(", ")}`);
}

export function assertNoFindings(result, category = null) {
  const list = category ? result.findings.filter((f) => f.category === category) : result.findings;
  assert.strictEqual(list.length, 0, `Expected no findings${category ? ` in category "${category}"` : ""}. Got: ${list.map((f) => f.ruleId).join(", ") || "none"}`);
}

export function assertFindingCount(result, minCount) {
  assert.ok(
    result.findings.length >= minCount,
    `Expected at least ${minCount} finding(s). Got: ${result.findings.length} (${result.findings.map((f) => f.ruleId).join(", ") || "none"})`
  );
}

export function assertNoHighSeverity(result) {
  const high = result.findings.filter((f) => f.severity === "critical" || f.severity === "error");
  assert.strictEqual(high.length, 0, `Expected no critical/error findings. Got: ${high.map((f) => f.ruleId).join(", ") || "none"}`);
}
