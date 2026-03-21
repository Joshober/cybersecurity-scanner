// RULE-SLOP-001 — dependency names that 404 on the public npm registry (slopsquat signal).

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";

export interface SlopsquatOptions {
  skipRegistry?: boolean;
}

function parsePackageJson(path: string): {
  deps: string[];
  workspaces: string[];
} {
  const raw = readFileSync(path, "utf-8");
  const j = JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    workspaces?: string[] | { packages?: string[] };
  };
  const deps = [
    ...Object.keys(j.dependencies ?? {}),
    ...Object.keys(j.devDependencies ?? {}),
  ];
  let workspaces: string[] = [];
  if (Array.isArray(j.workspaces)) workspaces = j.workspaces;
  else if (j.workspaces && Array.isArray(j.workspaces.packages)) workspaces = j.workspaces.packages;
  return { deps, workspaces };
}

async function headStatus(url: string): Promise<number> {
  const res = await fetch(url, { method: "HEAD", redirect: "manual" });
  return res.status;
}

/** Registry check for typosquat / slopsquat candidates. */
export async function checkDependencies(
  packageJsonPath: string,
  options: SlopsquatOptions = {}
): Promise<Finding[]> {
  const findings: Finding[] = [];
  if (options.skipRegistry || !existsSync(packageJsonPath)) return findings;

  let data: { deps: string[]; workspaces: string[] };
  try {
    data = parsePackageJson(packageJsonPath);
  } catch {
    return findings;
  }

  const wsSet = new Set(data.workspaces);

  for (const name of data.deps) {
    if (name.startsWith("@")) {
      const scoped404 = await headStatus(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
      if (scoped404 === 404) {
        findings.push({
          ruleId: "RULE-SLOP-001",
          message: `Scoped package "${name}" returned 404 from registry — verify private registry or typo.`,
          why: "Non-existent scoped packages may indicate a supply-chain or workspace misconfiguration.",
          fix: "Confirm the package exists or is served from a private registry in .npmrc.",
          severity: "info",
          severityLabel: "LOW",
          category: "injection",
          findingKind: "POSSIBLY_PRIVATE",
          cwe: 829,
          owasp: "A06:2021",
          line: 1,
          column: 0,
          filePath: packageJsonPath,
          source: packageJsonPath,
        });
      }
      continue;
    }

    if (wsSet.has(name) || data.workspaces.some((w) => w.includes(name))) continue;

    try {
      const status = await headStatus(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
      if (status === 404) {
        findings.push({
          ruleId: "RULE-SLOP-001",
          message: `Package "${name}" is not found on the public npm registry (slopsquat candidate).`,
          why: "Dependencies that 404 may be typos of popular packages or malicious squatting.",
          fix: "Verify the package name spelling and publisher; prefer lockfile integrity checks.",
          severity: "warning",
          severityLabel: "MEDIUM",
          category: "injection",
          findingKind: "SLOPSQUAT_CANDIDATE",
          cwe: 829,
          owasp: "A06:2021",
          line: 1,
          column: 0,
          filePath: packageJsonPath,
          source: packageJsonPath,
        });
      }
    } catch {
      // network failure — skip
    }
  }

  return findings;
}

export function findPackageJsonNear(projectRoot: string): string | undefined {
  const p = join(projectRoot, "package.json");
  return existsSync(p) ? p : undefined;
}
