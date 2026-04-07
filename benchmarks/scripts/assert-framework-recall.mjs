#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

function normRel(p) {
  return String(p || "").replace(/\\/g, "/").toLowerCase();
}

function findingMatchesCase(finding, c) {
  const filePath = normRel(finding.filePath || finding.file || "");
  const suffix = normRel(c.anchorSuffix || "");
  if (!filePath.endsWith(suffix)) return false;
  const line = Number(finding.line);
  return (c.anchorLines || []).some((L) => Number(L) === line);
}

function parseArgs(argv) {
  const out = {
    json: join(repoRoot, "benchmarks", "results", "ci_framework_vulns_vibescan", "vibescan-project.json"),
    catalog: join(repoRoot, "results", "framework-vuln-case-catalog.json"),
    highVolumeCatalog: join(repoRoot, "results", "framework-vuln-case-catalog-high-volume.json"),
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--json" && argv[i + 1]) out.json = resolve(repoRoot, argv[++i]);
    else if (argv[i] === "--catalog" && argv[i + 1]) out.catalog = resolve(repoRoot, argv[++i]);
    else if (argv[i] === "--high-volume-catalog" && argv[i + 1]) out.highVolumeCatalog = resolve(repoRoot, argv[++i]);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const project = JSON.parse(readFileSync(args.json, "utf8"));
  const catalog = JSON.parse(readFileSync(args.catalog, "utf8"));
  const highVolumeCatalog = JSON.parse(readFileSync(args.highVolumeCatalog, "utf8"));
  const allCases = [...(catalog.cases || []), ...(highVolumeCatalog.cases || [])];
  const findings = Array.isArray(project.findings) ? project.findings : [];
  const failures = [];

  for (const c of allCases) {
    const expected = new Set(c.expectedRuleIds || []);
    const rows = findings.filter((f) => findingMatchesCase(f, c));
    const got = new Set(rows.map((r) => r.ruleId).filter(Boolean));
    const hasExpected = [...expected].every((id) => got.has(id));
    if (!hasExpected) {
      failures.push({
        id: c.id,
        expected: [...expected],
        got: [...got],
      });
    }
  }

  if (failures.length) {
    throw new Error(
      `Framework recall assertion failed for ${failures.length} case(s):\n${failures
        .map((f) => `- ${f.id} expected ${f.expected.join(", ")} got ${f.got.join(", ") || "none"}`)
        .join("\n")}`
    );
  }
  console.log(`Framework recall assertion passed (${allCases.length} case rows).`);
}

main();
