#!/usr/bin/env node
/**
 * Compare VibeScan finding counts across fixtures.
 * Optional: install eslint-plugin-security / bearer CLI and extend this script to run them.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanDirectory } from "../src/scan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const fixtures = [
  "tests/fixtures/vulnerable-express-app",
  "tests/fixtures/clean-express-app",
  "tests/fixtures/extractor-mounts",
];

console.log("fixture\tfiles\troutes\tfindings\tcritical");
for (const rel of fixtures) {
  const dir = path.join(root, rel);
  const { ctx, findings } = scanDirectory(dir);
  const crit = findings.filter((f) => f.severity === "critical").length;
  console.log(`${rel}\t${ctx.files.length}\t${ctx.routes.length}\t${findings.length}\t${crit}`);
}

console.log("\nTo compare with other tools (if installed):");
console.log("  npx eslint -c .eslintrc.cjs --plugin security tests/fixtures/vulnerable-express-app");
console.log("  bearer scan tests/fixtures/vulnerable-express-app");
