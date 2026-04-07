// Line-anchored regression tests for benchmarks/seeds/framework-vulns (Angular + Next.js patterns).

import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { scan } from "../../dist/system/scanner.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Monorepo root (…/CyberSecurity). */
const repoRoot = resolve(__dirname, "..", "..", "..");
const catalogPath = join(repoRoot, "results", "framework-vuln-case-catalog.json");
const highVolumeCatalogPath = join(repoRoot, "results", "framework-vuln-case-catalog-high-volume.json");

function normRel(p) {
  return String(p || "").replace(/\\/g, "/").toLowerCase();
}

function findingMatchesCase(finding, c) {
  const fp = normRel(finding.filePath || finding.file || "");
  const suf = normRel(c.anchorSuffix);
  if (!fp.endsWith(suf)) return false;
  const line = Number(finding.line);
  return c.anchorLines.some((L) => L === line);
}

describe("framework-vuln seeds (catalog × line anchors)", () => {
  it("catalog exists and every case has a matching primary-rule finding", () => {
    assert.ok(existsSync(catalogPath), `missing ${catalogPath}`);
    const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
    const highVolumeCatalog = existsSync(highVolumeCatalogPath)
      ? JSON.parse(readFileSync(highVolumeCatalogPath, "utf-8"))
      : { cases: [] };
    const allCases = [...(catalog.cases || []), ...(highVolumeCatalog.cases || [])];
    const seedRoot = join(repoRoot, catalog.corpusRoot || "benchmarks/seeds/framework-vulns");
    assert.ok(existsSync(seedRoot), `missing seed root ${seedRoot}`);

    for (const c of allCases) {
      const absFile = join(seedRoot, c.anchorSuffix.replace(/^\//, ""));
      assert.ok(existsSync(absFile), `missing seed file ${absFile}`);
      const source = readFileSync(absFile, "utf-8");
      const result = scan(source, absFile, { projectRoot: seedRoot });

      const expected = new Set(c.expectedRuleIds);
      const hits = result.findings.filter((f) => findingMatchesCase(f, c));
      assert.ok(hits.length > 0, `${c.id}: no finding on ${c.anchorSuffix} lines ${c.anchorLines.join(",")}`);

      const matchedRule = hits.some((f) => expected.has(f.ruleId));
      assert.ok(
        matchedRule,
        `${c.id}: expected one of ${[...expected].join(", ")}, got ${hits.map((h) => `${h.ruleId}@${h.line}`).join("; ")}`
      );
    }
  });
});
