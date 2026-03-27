#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { runVibeScanProjectBootstrap } from "./projectInit.js";
const scanCliPath = join(__dirname, "index.js");
const secureArchCliPath = join(__dirname, "../../node_modules/@secure-arch/cli/dist/cli.js");

function spawnCli(cliPath: string, args: string[]): number {
  const r = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  if (typeof r.status === "number") return r.status;
  if (r.error) {
    console.error(r.error);
  }
  return 1;
}

function main(): void {
  const argv = process.argv.slice(2);
  const first = String(argv[0] ?? "");

  if (first === "prove") {
    const rest = argv.slice(1);
    let genDir: string | undefined;
    const filtered: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--output" && rest[i + 1]) {
        genDir = rest[++i];
        continue;
      }
      filtered.push(rest[i]);
    }
    const paths = filtered.filter((a) => !a.startsWith("-"));
    const flags = filtered.filter((a) => a.startsWith("-"));
    const scanArgs = [...(paths.length > 0 ? paths : ["."]), ...flags, "--generate-tests"];
    if (genDir) scanArgs.push(genDir);
    if (!existsSync(scanCliPath)) {
      console.error(`Missing scan CLI: ${scanCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(scanCliPath, scanArgs));
  }

  if (first === "export-ai-rules") {
    void import("./exportAiRules.js")
      .then((m) => m.runExportAiRulesCliAsync(argv.slice(1), __dirname))
      .then((code) => process.exit(code))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
    return;
  }

  if (first === "secure-arch") {
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(secureArchCliPath, argv.slice(1)));
  }

  if (first === "init") {
    const boot = runVibeScanProjectBootstrap(__dirname, process.cwd());
    for (const c of boot.created) console.log(`vibescan init: created ${c}`);
    for (const s of boot.skipped) console.log(`vibescan init: ${s}`);
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(secureArchCliPath, argv));
  }

  // Default: route everything else to the existing scan CLI (`index.js`).
  if (!existsSync(scanCliPath)) {
    console.error(`Missing scan CLI: ${scanCliPath}`);
    process.exit(1);
  }
  process.exit(spawnCli(scanCliPath, argv));
}

main();

