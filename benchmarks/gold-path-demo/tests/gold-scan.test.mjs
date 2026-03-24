/**
 * Regression: VibeScan CLI must report expected rules on vulnerable apps
 * and not report them on fixed apps (for the listed rule IDs).
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert";

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(here, "..");
const cli = join(demoRoot, "..", "..", "vibescan", "dist", "system", "cli", "index.js");

function scanDir(absDir) {
  const r = spawnSync(process.execPath, [cli, "scan", absDir, "--format", "json", "--exclude-vendor"], {
    encoding: "utf8",
    maxBuffer: 20_000_000,
  });
  let out = r.stdout?.trim() ?? "";
  if (!out && r.stderr) {
    const m = /(\{[\s\S]*\})\s*$/.exec(r.stderr);
    if (m) out = m[1];
  }
  assert.ok(out.length > 0, `no JSON stdout from scan (status ${r.status}): ${r.stderr?.slice(0, 500)}`);
  return JSON.parse(out);
}

function ruleIds(project) {
  const fs = project.findings ?? [];
  return new Set(fs.map((f) => f.ruleId));
}

const casesDir = join(demoRoot, "cases");
const caseIds = readdirSync(casesDir).filter((d) => existsSync(join(casesDir, d, "meta.json")));

describe("gold-path scan regression", () => {
  it("vibescan CLI is built", () => {
    assert.ok(existsSync(cli), `Build vibescan first: missing ${cli}`);
  });

  for (const cid of caseIds) {
    const metaPath = join(casesDir, cid, "meta.json");
    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const vulnDir = join(casesDir, cid, "vulnerable");
    const fixDir = join(casesDir, cid, "fixed");

    it(`${meta.id}: vulnerable surfaces at least one expected rule`, () => {
      const project = scanDir(vulnDir);
      const ids = ruleIds(project);
      const want = meta.vulnerableRuleIds;
      const any = want.some((r) => ids.has(r));
      assert.ok(any, `expected one of [${want.join(", ")}], got: ${[...ids].join(", ")}`);
    });

    it(`${meta.id}: fixed does not report remediated rule IDs`, () => {
      const project = scanDir(fixDir);
      const ids = ruleIds(project);
      for (const r of meta.expectAbsentWhenFixed) {
        assert.ok(!ids.has(r), `fixed app should not trigger ${r}, findings: ${[...ids].join(", ")}`);
      }
    });
  }
});
