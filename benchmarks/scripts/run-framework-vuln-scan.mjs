#!/usr/bin/env node
/**
 * Scan benchmarks/seeds/framework-vulns and write vibescan-project.json + minimal manifest.
 *
 * From repo root:
 *   node benchmarks/scripts/run-framework-vuln-scan.mjs
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const seedRoot = join(repoRoot, "benchmarks", "seeds", "framework-vulns");
const catalogPath = join(repoRoot, "results", "framework-vuln-case-catalog.json");
const highVolumeCatalogPath = join(repoRoot, "results", "framework-vuln-case-catalog-high-volume.json");
const vibescanCli = join(repoRoot, "vibescan", "dist", "system", "cli", "index.js");

function utcStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}_${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

function parseArgs(argv) {
  const out = { outDir: null, extraScanArgs: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out-dir" && argv[i + 1]) {
      out.outDir = resolve(repoRoot, argv[++i]);
      continue;
    }
    out.extraScanArgs.push(a);
  }
  return out;
}

function main() {
  if (!existsSync(seedRoot)) {
    console.error(`Missing seed corpus: ${seedRoot}`);
    process.exit(1);
  }
  if (!existsSync(vibescanCli)) {
    console.error(`Missing ${vibescanCli} — run: cd vibescan && npm run build`);
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
  const highVolumeCatalog = existsSync(highVolumeCatalogPath)
    ? JSON.parse(readFileSync(highVolumeCatalogPath, "utf-8"))
    : { cases: [] };
  const allCases = [...(catalog.cases || []), ...(highVolumeCatalog.cases || [])];
  const { outDir: outDirArg, extraScanArgs } = parseArgs(process.argv);
  const outDir = outDirArg ?? join(repoRoot, "benchmarks", "results", `${utcStamp()}_framework_vulns_vibescan`);
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "manifest.json");
  const jsonPath = join(outDir, "vibescan-project.json");

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        benchmarkName: "Framework seeds / VibeScan",
        runDate: { utcIso8601: new Date().toISOString() },
        scope: {
          projectRoot: seedRoot,
          catalog: "results/framework-vuln-case-catalog.json + results/framework-vuln-case-catalog-high-volume.json",
          cases: allCases.length,
        },
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
    seedRoot,
    "--format",
    "json",
    "--project-root",
    seedRoot,
    "--exclude-vendor",
    "--manifest",
    manifestPath,
    ...extraScanArgs,
  ];

  const r = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
    env: process.env,
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
  if (code !== 0 && code !== 1) {
    console.error(r.stderr || `vibescan exited ${code}`);
    process.exit(code);
  }
  console.error(`Wrote ${jsonPath} (vibescan exit ${code})`);
}

main();
