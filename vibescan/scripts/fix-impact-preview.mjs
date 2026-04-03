#!/usr/bin/env node
/**
 * Fix impact preview (manual workflow helper):
 * 1. Run a baseline scan with proofs: `vibescan scan . --format json --generate-tests ./vibescan-proofs > before.json`
 * 2. Apply your code fix in the repo.
 * 3. Run again: `node vibescan/scripts/fix-impact-preview.mjs before.json after.json`
 *
 * Compares finding counts and proof summary between two project JSON files.
 */

import { readFileSync } from "node:fs";

function load(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

const beforePath = process.argv[2];
const afterPath = process.argv[3];
if (!beforePath || !afterPath) {
  console.error("Usage: node fix-impact-preview.mjs <before.json> <after.json>");
  process.exit(1);
}

const a = load(beforePath);
const b = load(afterPath);
const af = a.findings?.length ?? 0;
const bf = b.findings?.length ?? 0;
console.log(`Findings before: ${af}, after: ${bf} (delta ${bf - af})`);
const pcA = a.summary?.proofCoverage ?? {};
const pcB = b.summary?.proofCoverage ?? {};
console.log("Proof coverage % before:", pcA.proof_coverage_percent, "after:", pcB.proof_coverage_percent);
console.log("Deterministic proof % before:", pcA.deterministic_proof_percent, "after:", pcB.deterministic_proof_percent);
