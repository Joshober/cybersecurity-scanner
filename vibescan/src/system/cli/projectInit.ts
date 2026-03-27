// Bootstrap a repo for VibeScan CI: config + GitHub Actions workflow (idempotent).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface ProjectInitResult {
  created: string[];
  skipped: string[];
}

function packageRootFromCliDir(cliDir: string): string {
  // cliDir = .../dist/system/cli
  return resolve(cliDir, "..", "..", "..");
}

export function runVibeScanProjectBootstrap(cliDir: string, projectRoot: string): ProjectInitResult {
  const root = resolve(projectRoot);
  const pkg = packageRootFromCliDir(cliDir);
  const created: string[] = [];
  const skipped: string[] = [];

  const sampleConfig = join(pkg, "vibescan.config.sample.json");
  const destConfig = join(root, "vibescan.config.json");
  if (!existsSync(destConfig)) {
    const body = readFileSync(sampleConfig, "utf-8");
    writeFileSync(destConfig, body, "utf-8");
    created.push("vibescan.config.json");
  } else {
    skipped.push("vibescan.config.json (already exists)");
  }

  const template = join(pkg, "templates", "github-actions.yml");
  const wfDir = join(root, ".github", "workflows");
  const wfPath = join(wfDir, "vibescan.yml");
  if (!existsSync(wfPath)) {
    mkdirSync(wfDir, { recursive: true });
    const body = readFileSync(template, "utf-8");
    writeFileSync(wfPath, body, "utf-8");
    created.push(".github/workflows/vibescan.yml");
  } else {
    skipped.push(".github/workflows/vibescan.yml (already exists)");
  }

  return { created, skipped };
}
