import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import fg from "fast-glob";
import { scanProjectAsync } from "vibescan";
import type { ArchitectureFinding } from "../types.js";

const CORRELATION_RULES: Record<string, { archRule: string; message: string; severity: ArchitectureFinding["severity"] }> = {
  "MW-004": {
    archRule: "ARCH-E001",
    message: "Code uses CORS wildcard origin ('*'); settings should not claim strict browser origin control without fixing code.",
    severity: "error",
  },
  AUTH: {
    archRule: "ARCH-E002",
    message: "State-changing routes appear to lack auth middleware; verify against declared authentication.enabled.",
    severity: "warning",
  },
  "crypto.secrets.hardcoded": {
    archRule: "ARCH-E003",
    message: "Hardcoded secret pattern in code; contradicts secrets.embeddedInRepo=false.",
    severity: "critical",
  },
  "SEC-004": {
    archRule: "ARCH-E004",
    message: "Weak process.env fallback for secrets detected in code.",
    severity: "error",
  },
};

function collectJsTsFiles(paths: string[], cwd: string): { path: string; source: string }[] {
  const entries: { path: string; source: string }[] = [];
  for (const p of paths) {
    const abs = resolve(cwd, p);
    if (!existsSync(abs)) continue;
    const st = statSync(abs);
    if (st.isFile()) {
      entries.push({ path: abs, source: readFileSync(abs, "utf-8") });
    } else if (st.isDirectory()) {
      const found = fg.sync(["**/*.{js,ts,mjs,cjs}"], { cwd: abs, absolute: true, ignore: ["**/node_modules/**", "**/dist/**"] });
      for (const f of found) {
        entries.push({ path: f, source: readFileSync(f, "utf-8") });
      }
    }
  }
  return entries;
}

export async function runJsTsEvidence(projectRoot: string, scanPaths: string[]): Promise<ArchitectureFinding[]> {
  const files = collectJsTsFiles(scanPaths.length ? scanPaths : ["."], projectRoot);
  if (files.length === 0) return [];

  const project = await scanProjectAsync(files, { crypto: true, injection: true }, projectRoot);
  const findings: ArchitectureFinding[] = [];

  for (const f of project.findings) {
    if (f.ruleId === "MW-004") {
      const meta = CORRELATION_RULES["MW-004"];
      findings.push({
        ruleId: meta.archRule,
        severity: meta.severity,
        message: meta.message,
        why: f.why,
        remediation: f.remediation ?? f.fix,
        evidence: [`${f.filePath ?? "?"}:${f.line}`],
        cwe: f.cwe,
        owasp: f.owasp,
      });
      continue;
    }
    if (f.ruleId === "AUTH-003") {
      const meta = CORRELATION_RULES.AUTH;
      findings.push({
        ruleId: meta.archRule,
        severity: meta.severity,
        message: meta.message,
        why: f.why,
        remediation: f.remediation ?? f.fix,
        evidence: [`${f.filePath ?? "?"}:${f.line}`],
        cwe: f.cwe,
        owasp: f.owasp,
      });
      continue;
    }
    if (f.ruleId === "crypto.secrets.hardcoded") {
      const meta = CORRELATION_RULES["crypto.secrets.hardcoded"];
      findings.push({
        ruleId: meta.archRule,
        severity: meta.severity,
        message: meta.message,
        evidence: [`${f.filePath ?? "?"}:${f.line}`],
        cwe: f.cwe,
        owasp: f.owasp,
      });
      continue;
    }
    if (f.ruleId === "SEC-004") {
      const meta = CORRELATION_RULES["SEC-004"];
      findings.push({
        ruleId: meta.archRule,
        severity: meta.severity,
        message: meta.message,
        evidence: [`${f.filePath ?? "?"}:${f.line}`],
        cwe: f.cwe,
        owasp: f.owasp,
      });
      continue;
    }
  }

  return findings;
}
