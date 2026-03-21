// SLOP-001 — dependency names that 404 on the public npm registry (slopsquat signal).

import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import fg from "fast-glob";
import type { Finding } from "../types.js";

export interface SlopsquatOptions {
  skipRegistry?: boolean;
  /** Override fetch for tests or restricted networks. */
  fetchImpl?: (input: string, init?: RequestInit) => Promise<{ status: number }>;
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

function usesNonPublicNpmRegistry(packageJsonPath: string): boolean {
  let dir = dirname(packageJsonPath);
  for (;;) {
    const rc = join(dir, ".npmrc");
    if (existsSync(rc)) {
      const lines = readFileSync(rc, "utf-8").split(/\r?\n/);
      for (const line of lines) {
        const m = line.match(/^\s*registry\s*=\s*(.+?)\s*$/);
        if (!m) continue;
        const raw = m[1].trim().replace(/^["']|["']$/g, "");
        if (!raw) continue;
        try {
          const host = new URL(raw).hostname.replace(/^www\./, "");
          if (host !== "registry.npmjs.org") return true;
        } catch {
          return true;
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return false;
}

/** Resolve workspace globs to internal `package.json` `name` fields (no substring heuristics). */
function workspacePackageNames(packageJsonDir: string, workspacePatterns: string[]): Set<string> {
  const names = new Set<string>();
  for (const pattern of workspacePatterns) {
    const matches = fg.sync(pattern.replace(/\\/g, "/"), {
      cwd: packageJsonDir,
      onlyFiles: false,
      markDirectories: true,
    });
    for (const rel of matches) {
      const pj = join(packageJsonDir, rel, "package.json");
      if (!existsSync(pj)) continue;
      try {
        const meta = JSON.parse(readFileSync(pj, "utf-8")) as { name?: string };
        if (typeof meta.name === "string" && meta.name.length > 0) names.add(meta.name);
      } catch {
        /* ignore */
      }
    }
  }
  return names;
}

function mkFinding(
  packageJsonPath: string,
  packageName: string,
  extra: Partial<Finding> & Pick<Finding, "message" | "severity" | "severityLabel" | "findingKind">
): Finding {
  return {
    ruleId: "SLOP-001",
    packageName,
    category: "injection",
    cwe: 829,
    owasp: "A06:2021",
    cveRef: ["USENIX-2025-slopsquatting"],
    line: 1,
    column: 0,
    filePath: packageJsonPath,
    source: packageJsonPath,
    ...extra,
  };
}

async function headStatuses(
  names: string[],
  fetcher: (input: string, init?: RequestInit) => Promise<{ status: number }>,
  concurrency: number
): Promise<number[]> {
  const results: number[] = new Array(names.length);
  let index = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = index++;
      if (i >= names.length) return;
      const name = names[i];
      try {
        const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
        const res = await fetcher(url, { method: "HEAD", redirect: "manual" });
        results[i] = res.status;
      } catch {
        results[i] = -1;
      }
    }
  }

  const n = Math.min(concurrency, Math.max(1, names.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

/** Registry check for typosquat / slopsquat candidates. */
export async function checkDependencies(
  packageJsonPath: string,
  options: SlopsquatOptions = {}
): Promise<Finding[]> {
  const findings: Finding[] = [];
  if (options.skipRegistry || !existsSync(packageJsonPath)) return findings;

  if (usesNonPublicNpmRegistry(packageJsonPath)) return findings;

  let data: { deps: string[]; workspaces: string[] };
  try {
    data = parsePackageJson(packageJsonPath);
  } catch {
    return findings;
  }

  const packageJsonDir = dirname(packageJsonPath);
  const workspaceNames = workspacePackageNames(packageJsonDir, data.workspaces);

  const toCheck: { name: string; scoped: boolean }[] = [];
  for (const name of data.deps) {
    if (workspaceNames.has(name)) continue;
    toCheck.push({ name, scoped: name.startsWith("@") });
  }

  const fetcher = options.fetchImpl ?? ((u: string, init?: RequestInit) => fetch(u, init));

  const names = toCheck.map((t) => t.name);
  const statuses = await headStatuses(names, fetcher, 5);

  for (let i = 0; i < toCheck.length; i++) {
    const { name, scoped } = toCheck[i];
    const status = statuses[i];
    if (status === -1) continue;
    if (status !== 404) continue;

    if (scoped) {
      findings.push(
        mkFinding(packageJsonPath, name, {
          message: `Scoped package "${name}" returned 404 from the public npm registry — verify private registry or typo.`,
          why: "Scoped packages missing from registry may be private or mis-typed.",
          fix: "Confirm the package exists or is published to your private registry.",
          remediation:
            "Verify the package in your org’s registry or correct the name; configure .npmrc for private scope if needed.",
          severity: "info",
          severityLabel: "LOW",
          findingKind: "POSSIBLY_PRIVATE",
        })
      );
    } else {
      findings.push(
        mkFinding(packageJsonPath, name, {
          message: `Package "${name}" is not found on the public npm registry (slopsquat candidate).`,
          why: "Dependencies that 404 may be typos of popular packages or malicious squatting.",
          fix: "Verify the package name spelling and publisher; prefer lockfile integrity checks.",
          remediation: "Remove or replace the dependency after verifying the intended package and publisher.",
          severity: "error",
          severityLabel: "HIGH",
          findingKind: "SLOPSQUAT_CANDIDATE",
        })
      );
    }
  }

  return findings;
}

export function findPackageJsonNear(projectRoot: string): string | undefined {
  const p = join(projectRoot, "package.json");
  return existsSync(p) ? p : undefined;
}

/** @internal Test helper — writes minimal workspace fixture and returns package.json path. */
export function writeSlopsquatFixture(
  root: string,
  spec: {
    deps: Record<string, string>;
    workspaces?: string[];
    workspacePackages?: { path: string; name: string }[];
  }
): string {
  mkdirSync(root, { recursive: true });
  const pj = join(root, "package.json");
  const ws = spec.workspaces ?? [];
  writeFileSync(
    pj,
    JSON.stringify(
      {
        name: "fixture-root",
        private: true,
        workspaces: ws.length ? ws : undefined,
        dependencies: spec.deps,
      },
      null,
      2
    ),
    "utf-8"
  );
  for (const wp of spec.workspacePackages ?? []) {
    const dir = join(root, wp.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: wp.name, version: "1.0.0" }), "utf-8");
  }
  return pj;
}

/** @internal */
export function rmSlopsquatFixture(root: string): void {
  rmSync(root, { recursive: true, force: true });
}
