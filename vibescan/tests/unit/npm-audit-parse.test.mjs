import { describe, it } from "node:test";
import assert from "node:assert";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseNpmAuditJsonToFindings } from "../../dist/system/npmAudit.js";

describe("npm audit JSON → findings", () => {
  it("parses vulnerabilities block with CVE in via", () => {
    const json = JSON.stringify({
      vulnerabilities: {
        minimist: {
          name: "minimist",
          severity: "high",
          via: [
            {
              source: 123,
              name: "minimist",
              title: "Prototype pollution",
              vulnerability: "CVE-2021-12345",
            },
          ],
          range: "<=1.2.5",
          fixAvailable: true,
        },
      },
    });
    const dir = mkdtempSync(join(tmpdir(), "vs-npmaudit-"));
    const pj = join(dir, "package.json");
    writeFileSync(pj, JSON.stringify({ dependencies: { minimist: "1.2.0" } }), "utf8");
    const { findings, parseError } = parseNpmAuditJsonToFindings(json, pj);
    rmSync(dir, { recursive: true, force: true });
    assert.ok(!parseError);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "supply_chain.npm_audit");
    assert.strictEqual(findings[0].severity, "error");
    assert.strictEqual(findings[0].packageName, "minimist");
    assert.deepStrictEqual(findings[0].cveRef, ["CVE-2021-12345"]);
    assert.strictEqual(findings[0].category, "supply_chain");
  });

  it("returns empty array for empty vulnerabilities", () => {
    const { findings } = parseNpmAuditJsonToFindings("{}", "/tmp/x/package.json");
    assert.strictEqual(findings.length, 0);
  });
});
