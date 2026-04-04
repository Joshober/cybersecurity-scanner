#!/usr/bin/env node
/**
 * Re-run VibeScan on the pinned DVNA checkout and write a fresh project JSON + manifest
 * under benchmarks/results/<UTC>_<slug>/.
 *
 * By default this injects `--generate-tests` with output under
 * `benchmarks/results/dvna_vibescan_proofs/` so the JSON includes proofGeneration +
 * full proof tier rollup (same as `vibescan prove`). Pass `--no-generate-tests` to skip.
 *
 * Prerequisites: DVNA at benchmarks/dvna/dvna (see benchmarks/dvna/README.md).
 * Usage (from repo root):
 *   node benchmarks/scripts/run-dvna-vibescan-scan.mjs
 *   node benchmarks/scripts/run-dvna-vibescan-scan.mjs --benchmark-metadata
 *   node benchmarks/scripts/run-dvna-vibescan-scan.mjs --no-generate-tests   # scan only
 *   node benchmarks/scripts/run-dvna-vibescan-scan.mjs --generate-tests other/dir  # override output dir
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const dvnaRoot = join(repoRoot, "benchmarks", "dvna", "dvna");
const vibescanCli = join(repoRoot, "vibescan", "dist", "system", "cli", "index.js");

function utcStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}_${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

function main() {
  if (!existsSync(dvnaRoot)) {
    console.error(`Missing DVNA checkout: ${dvnaRoot}\nSee benchmarks/dvna/README.md`);
    process.exit(1);
  }
  if (!existsSync(vibescanCli)) {
    console.error(`Missing ${vibescanCli} — run: cd vibescan && npm run build`);
    process.exit(1);
  }
  const rawArgv = process.argv.slice(2);
  const noGenerateTests = rawArgv.includes("--no-generate-tests");
  const userArgs = rawArgv.filter((a) => a !== "--no-generate-tests");
  const userRequestedGen = userArgs.includes("--generate-tests");
  const proofOutDir = join(repoRoot, "benchmarks", "results", "dvna_vibescan_proofs");
  mkdirSync(proofOutDir, { recursive: true });
  const generateTestsArgs =
    noGenerateTests || userRequestedGen ? [] : ["--generate-tests", proofOutDir];
  const outDir = join(repoRoot, "benchmarks", "results", `${utcStamp()}_dvna_vibescan_cli`);
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "manifest.json");
  const jsonPath = join(outDir, "vibescan-project.json");

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        benchmarkName: "DVNA / VibeScan",
        runDate: { utcIso8601: new Date().toISOString() },
        scope: { projectRoot: dvnaRoot, excludedGlobs: ["**/node_modules/**"] },
        outputs: { directory: outDir, vibescanProjectJson: jsonPath },
      },
      null,
      2
    ),
    "utf-8"
  );

  const args = [
    vibescanCli,
    "scan",
    dvnaRoot,
    "--format",
    "json",
    "--project-root",
    dvnaRoot,
    "--exclude-vendor",
    "--manifest",
    manifestPath,
    ...generateTestsArgs,
    ...userArgs,
  ];

  const r = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env },
  });
  const stdout = r.stdout ?? "";
  let payload = null;
  try {
    payload = JSON.parse(stdout.trim());
  } catch {
    console.error(r.stderr || stdout || "vibescan: stdout was not JSON");
    process.exit(r.status ?? 1);
  }
  if (!payload?.summary) {
    console.error("vibescan: JSON missing summary");
    process.exit(r.status ?? 1);
  }
  writeFileSync(jsonPath, stdout, "utf-8");
  const code = typeof r.status === "number" ? r.status : 1;
  // Exit 1 = findings failed severity gate (expected on DVNA); 0 = clean.
  if (code !== 0 && code !== 1) {
    console.error(r.stderr || `vibescan exited ${code}`);
    process.exit(code);
  }
  console.error(`Wrote ${jsonPath} (vibescan exit ${code})`);
  console.log(
    `Next: node benchmarks/scripts/dvna-poster-charts.mjs --vibescan-json ${jsonPath} --fill-codeql benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/codeql.sarif`
  );
}

main();
