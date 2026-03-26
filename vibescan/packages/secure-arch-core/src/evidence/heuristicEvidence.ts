import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import fg from "fast-glob";
import type { ArchitectureFinding } from "../types.js";

const PY_PATTERNS: { id: string; re: RegExp; message: string; severity: ArchitectureFinding["severity"] }[] = [
  {
    id: "ARCH-H001",
    re: /ALLOWED_HOSTS\s*=\s*\[\s*['"]\*['"]\s*\]/,
    message: "Django-style ALLOWED_HOSTS may be overly permissive.",
    severity: "warning",
  },
  {
    id: "ARCH-H002",
    re: /CORS_ORIGIN_ALLOW_ALL\s*=\s*True/,
    message: "django-cors-headers allows all origins.",
    severity: "warning",
  },
  {
    id: "ARCH-H003",
    re: /subprocess\.(run|Popen|call)\s*\(/,
    message: "subprocess usage — verify command injection boundaries.",
    severity: "info",
  },
  {
    id: "ARCH-H004",
    re: /(password|secret|api_key)\s*=\s*['"][^'"]+['']/i,
    message: "Possible hardcoded credential in Python source.",
    severity: "error",
  },
];

const JAVA_PATTERNS: { id: string; re: RegExp; message: string; severity: ArchitectureFinding["severity"] }[] = [
  {
    id: "ARCH-H010",
    re: /@CrossOrigin\s*\(\s*origins\s*=\s*["']\*["']\s*\)/,
    message: "Spring CrossOrigin wildcard — review CORS policy.",
    severity: "warning",
  },
  {
    id: "ARCH-H011",
    re: /new\s+ProcessBuilder\s*\(/,
    message: "ProcessBuilder usage — verify command construction.",
    severity: "info",
  },
  {
    id: "ARCH-H012",
    re: /(password|secret|apiKey)\s*=\s*["'][^"']+["']/i,
    message: "Possible hardcoded credential in Java source.",
    severity: "error",
  },
];

function scanGlob(
  cwd: string,
  globs: string[],
  patterns: { id: string; re: RegExp; message: string; severity: ArchitectureFinding["severity"] }[]
): ArchitectureFinding[] {
  const out: ArchitectureFinding[] = [];
  const files = fg.sync(globs, { cwd, absolute: true, ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"] });
  for (const file of files) {
    if (!existsSync(file)) continue;
    let text: string;
    try {
      text = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    for (const { id, re, message, severity } of patterns) {
      if (re.test(text)) {
        out.push({
          ruleId: id,
          severity,
          message,
          evidence: [file],
          why: "Heuristic pattern match — confirm in context.",
        });
      }
    }
  }
  return out;
}

export function runHeuristicEvidence(projectRoot: string, scanPaths: string[]): ArchitectureFinding[] {
  const roots = scanPaths.length ? scanPaths.map((p) => resolve(projectRoot, p)) : [projectRoot];
  const findings: ArchitectureFinding[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const st = statSync(root);
    const cwd = st.isDirectory() ? root : resolve(root, "..");
    findings.push(...scanGlob(cwd, ["**/*.py"], PY_PATTERNS));
    findings.push(...scanGlob(cwd, ["**/*.java"], JAVA_PATTERNS));
  }
  return findings;
}
