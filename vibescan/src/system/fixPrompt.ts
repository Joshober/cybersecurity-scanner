// Build a copy-paste prompt for an LLM assistant from scan findings (deterministic text).

import type { Finding, Severity } from "./types.js";

function severityWeight(sev: Severity): number {
  const order: Record<Severity, number> = { critical: 4, error: 3, warning: 2, info: 1 };
  return order[sev] ?? 0;
}

function sortBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const w = severityWeight(b.severity) - severityWeight(a.severity);
    if (w !== 0) return w;
    const fa = a.filePath ?? "";
    const fb = b.filePath ?? "";
    if (fa !== fb) return fa.localeCompare(fb);
    return (a.line ?? 0) - (b.line ?? 0);
  });
}

/**
 * Markdown-style prompt: severity-ordered findings with remediation hooks.
 * Intended for external LLMs; output is reproducible for the same finding list.
 */
export function buildFixAssistantPrompt(params: {
  projectLabel: string;
  findings: Finding[];
  maxFindings?: number;
}): string {
  const max = params.maxFindings ?? 40;
  const sorted = sortBySeverity(params.findings).slice(0, max);
  const header = `You are helping secure a JavaScript/TypeScript codebase after a **VibeScan** run.

**Project / context:** ${params.projectLabel}

**Instructions**
1. Propose minimal, reviewable code changes ordered by severity (critical/error first).
2. For dependency advisories (rule \`supply_chain.npm_audit\`), prefer upgrades and \`npm audit fix\` where safe.
3. For HTTP probe results (\`probe.http.*\`), do not confuse them with full DAST — they are shallow reachability checks only.
4. If a finding is a false positive, explain why briefly.

---

`;

  if (sorted.length === 0) {
    return header + "_No findings were included in this prompt._\n";
  }

  const blocks = sorted.map((f, i) => {
    const n = i + 1;
    const loc = `${f.filePath ?? "(unknown)"}:${f.line}`;
    const remed = f.remediation ?? f.fix ?? "";
    const why = f.why ? `\n**Why:** ${f.why}\n` : "";
    const pkg = f.packageName ? `\n**Package:** ${f.packageName}\n` : "";
    const cve = f.cveRef?.length ? `\n**CVE:** ${f.cveRef.join(", ")}\n` : "";
    const fix = remed
      ? `**Fix direction:** ${remed}\n`
      : "**Fix direction:** Interpret the rule id and apply OWASP-aligned patterns for this class.\n";
    return (
      `### ${n}. \`${f.ruleId}\` (${f.severityLabel}) — \`${loc}\`\n` +
      `**Issue:** ${f.message}\n` +
      why +
      pkg +
      cve +
      fix
    );
  });

  const footer = `\n---\n_End of VibeScan-generated prompt (${sorted.length} finding(s))._\n`;
  return header + blocks.join("\n") + footer;
}
