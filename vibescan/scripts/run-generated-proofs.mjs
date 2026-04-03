#!/usr/bin/env node
/**
 * Run all `*.test.mjs` files under a proof output directory with Node's test runner.
 *
 * Usage (from repo root or any cwd):
 *   node vibescan/scripts/run-generated-proofs.mjs ./path/to/proof-output
 *
 * CI: exit code is non-zero if any test fails (same as `node --test`).
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node vibescan/scripts/run-generated-proofs.mjs <proof-output-directory>");
  process.exit(2);
}
if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  console.error(`Not a directory: ${dir}`);
  process.exit(2);
}

const r = spawnSync(process.execPath, ["--test", dir], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? "test" },
});
process.exit(r.status === null ? 1 : r.status);
