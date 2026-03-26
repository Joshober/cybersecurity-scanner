#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

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

  if (first === "secure-arch") {
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(secureArchCliPath, argv.slice(1)));
  }

  if (first === "export-ai-rules") {
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    // Alias: `export-ai-rules` => `secure-arch init`
    process.exit(spawnCli(secureArchCliPath, ["init", ...argv.slice(1)]));
  }

  if (first === "init") {
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    // Alias: `vibescan init` => `secure-arch init`
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

