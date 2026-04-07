#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

function readJson(absPath) {
  return JSON.parse(readFileSync(absPath, "utf-8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateFrameworkCatalog() {
  const catalogPath = join(repoRoot, "results", "framework-vuln-case-catalog.json");
  const catalog = readJson(catalogPath);
  const corpusRoot = join(repoRoot, catalog.corpusRoot || "benchmarks/seeds/framework-vulns");
  assert(existsSync(corpusRoot), `Missing framework corpus root: ${corpusRoot}`);
  assert(Array.isArray(catalog.cases) && catalog.cases.length > 0, "Framework catalog has no cases.");

  const ids = new Set();
  for (const c of catalog.cases) {
    assert(typeof c.id === "string" && c.id.length > 0, "Framework case missing id.");
    assert(!ids.has(c.id), `Duplicate framework case id: ${c.id}`);
    ids.add(c.id);
    assert(typeof c.anchorSuffix === "string" && c.anchorSuffix.length > 0, `${c.id}: missing anchorSuffix`);
    assert(Array.isArray(c.anchorLines) && c.anchorLines.length > 0, `${c.id}: missing anchorLines`);
    assert(Array.isArray(c.expectedRuleIds) && c.expectedRuleIds.length > 0, `${c.id}: missing expectedRuleIds`);
    const absFile = join(corpusRoot, c.anchorSuffix.replace(/^\//, ""));
    assert(existsSync(absFile), `${c.id}: missing seed file ${absFile}`);
  }
}

function validateFrameworkHighVolumeCatalog() {
  const catalogPath = join(repoRoot, "results", "framework-vuln-case-catalog-high-volume.json");
  const catalog = readJson(catalogPath);
  const corpusRoot = join(repoRoot, catalog.corpusRoot || "benchmarks/seeds/framework-vulns");
  assert(existsSync(corpusRoot), `Missing high-volume framework corpus root: ${corpusRoot}`);
  assert(Array.isArray(catalog.cases) && catalog.cases.length > 0, "High-volume framework catalog has no cases.");

  const ids = new Set();
  for (const c of catalog.cases) {
    assert(typeof c.id === "string" && c.id.length > 0, "High-volume framework case missing id.");
    assert(!ids.has(c.id), `Duplicate high-volume framework case id: ${c.id}`);
    ids.add(c.id);
    assert(typeof c.anchorSuffix === "string" && c.anchorSuffix.length > 0, `${c.id}: missing anchorSuffix`);
    assert(Array.isArray(c.anchorLines) && c.anchorLines.length > 0, `${c.id}: missing anchorLines`);
    assert(Array.isArray(c.expectedRuleIds) && c.expectedRuleIds.length > 0, `${c.id}: missing expectedRuleIds`);
    const absFile = join(corpusRoot, c.anchorSuffix.replace(/^\//, ""));
    assert(existsSync(absFile), `${c.id}: missing seed file ${absFile}`);
  }
}

function validateDvnaArtifacts() {
  const catalogPath = join(repoRoot, "results", "dvna-case-catalog.json");
  const matrixPath = join(repoRoot, "results", "dvna-detection-matrix.json");
  const chartsDir = join(repoRoot, "results", "charts");
  const catalog = readJson(catalogPath);
  const matrix = readJson(matrixPath);

  assert(Array.isArray(catalog.cases) && catalog.cases.length > 0, "DVNA catalog has no cases.");
  const ids = catalog.cases.map((c) => c.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, "DVNA catalog contains duplicate case ids.");
  if (Array.isArray(catalog.caseOrder)) {
    assert(catalog.caseOrder.length === ids.length, "DVNA caseOrder length does not match cases.");
    for (const id of catalog.caseOrder) {
      assert(uniqueIds.has(id), `DVNA caseOrder references unknown id: ${id}`);
    }
  }

  assert(Array.isArray(matrix.tools) && matrix.tools.length > 0, "DVNA detection matrix has no tools.");
  for (const tool of matrix.tools) {
    assert(tool && typeof tool === "object", "DVNA detection matrix has invalid tool entry.");
    if (tool.chartMode === "gap") continue;
    for (const id of ids) {
      const v = tool.detections?.[id];
      assert(v === true || v === false, `${tool.id || tool.label}: invalid detection value for ${id}`);
    }
  }

  const chartFiles = [
    "dvna-detection-rate-poster.html",
    "dvna-proof-coverage-poster.html",
    "dvna-proof-vs-peers-poster.html",
  ];
  for (const file of chartFiles) {
    assert(existsSync(join(chartsDir, file)), `Missing committed chart: results/charts/${file}`);
  }
}

function main() {
  validateFrameworkCatalog();
  validateFrameworkHighVolumeCatalog();
  validateDvnaArtifacts();
  console.log("Committed benchmark catalogs, matrix, and chart artifacts look consistent.");
}

main();
