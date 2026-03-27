// Markdown prompt for Cursor / Claude Code / editor assistants — no remote API keys.

import { writeFileSync } from "node:fs";
import type { Finding } from "../types.js";

function escCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function buildIdeAssistMarkdown(input: {
  projectRoot: string;
  findings: Finding[];
  scannedRelativePaths: string[];
}): string {
  const rows = input.findings.map((f) => {
    const loc = f.filePath != null ? `${f.filePath}:${f.line}` : `:${f.line}`;
    return `| ${escCell(f.ruleId)} | ${f.severity} | ${escCell(loc)} | ${escCell(f.message)} |`;
  });

  const table =
    rows.length > 0
      ? [
          "| ruleId | severity | location | message |",
          "| --- | --- | --- | --- |",
          ...rows,
        ].join("\n")
      : "_No findings at the current severity threshold._";

  const files = [...new Set(input.scannedRelativePaths)].sort();
  const filesBlock = files.length ? files.map((p) => `- \`${p}\``).join("\n") : "_No files listed._";

  const json = JSON.stringify(
    input.findings.map((f) => ({
      ruleId: f.ruleId,
      severity: f.severity,
      message: f.message,
      filePath: f.filePath,
      line: f.line,
      column: f.column,
      remediation: f.remediation ?? f.fix,
    })),
    null,
    2
  );

  return `# VibeScan — IDE-assisted security review

VibeScan **does not** call a remote LLM API or ask for API keys. This file is a **paste-in prompt** for tools that already run in your repo: **Cursor**, **Claude Code**, **Amazon Q**, etc.

## Paste into your assistant

Use the static findings below. For each row: open the location, confirm the issue, rate false-positive risk, and propose a concrete fix (code-level). Prefer minimal, testable changes. Map issues to OWASP / CWE when obvious.

### Summary table

${table}

### Files included in this scan

${filesBlock}

### Optional: install editor rules from VibeScan

\`\`\`bash
npx vibescan export-ai-rules --tool cursor
npx vibescan secure-arch init --tool cursor
\`\`\`

---

## Machine-readable findings (JSON)

\`\`\`json
${json}
\`\`\`

---
Project root (scanner): \`${input.projectRoot}\`
`;
}

export function writeIdeAssistPrompt(outPath: string, input: Parameters<typeof buildIdeAssistMarkdown>[0]): void {
  writeFileSync(outPath, buildIdeAssistMarkdown(input), "utf-8");
}
