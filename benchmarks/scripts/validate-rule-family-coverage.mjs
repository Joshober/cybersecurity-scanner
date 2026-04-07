#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(abs));
    else if (name.isFile() && abs.endsWith(".ts")) out.push(abs);
  }
  return out;
}

function collectRuleIds(dir) {
  const ids = new Set();
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    const matches = text.matchAll(/\bid:\s*"([^"]+)"/g);
    for (const m of matches) ids.add(m[1]);
  }
  return ids;
}

function main() {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, "results", "rule-family-coverage-manifest.json"), "utf8")
  );
  const covered = new Set();
  for (const family of manifest.families || []) {
    for (const id of family.ruleIds || []) covered.add(id);
  }

  const attackIds = collectRuleIds(join(repoRoot, "vibescan", "src", "attacks"));
  const aiIds = collectRuleIds(join(repoRoot, "vibescan", "src", "system", "ai"));
  const active = new Set([...attackIds, ...aiIds]);
  const missing = [...active].filter((id) => !covered.has(id)).sort();
  if (missing.length) {
    throw new Error(
      `Coverage manifest missing active rule IDs:\n${missing.map((m) => `- ${m}`).join("\n")}`
    );
  }
  console.log(`Rule-family coverage manifest validated (${active.size} active rule IDs mapped).`);
}

main();
