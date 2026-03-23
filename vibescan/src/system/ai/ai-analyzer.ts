// AI-based security analysis: sends code to an LLM and parses structured findings. Use with mode "ai" in scanner options.

import type { Finding, ScannerOptions, Severity, SeverityLabel } from "../types.js";
import type { Category } from "../types.js";

const SEVERITY_LABEL: Record<Severity, SeverityLabel> = {
  critical: "CRITICAL",
  error: "HIGH",
  warning: "MEDIUM",
  info: "LOW",
};

const SYSTEM_PROMPT = `You are a security analyst for JavaScript/TypeScript. Analyze the provided code for:
1. Cryptography failures: weak hashes (MD5, SHA-1), weak/deprecated ciphers, fixed IVs, Math.random() for secrets, hardcoded secrets, env fallback secrets, rejectUnauthorized: false.
2. Injection risks: SQL/NoSQL from string concat or user input, command injection, path traversal, XSS (innerHTML/document.write with dynamic content), eval/Function/setTimeout(string).

Respond with a JSON array only, no other text. Each item:
{
  "ruleId": "crypto.hash.weak" or "injection.sql.string-concat" etc. (use existing rule IDs when they fit),
  "message": "Short finding message",
  "why": "Brief explanation of the risk",
  "fix": "Concrete fix guidance",
  "severity": "error" | "warning" | "info",
  "category": "crypto" | "injection",
  "line": number (1-based),
  "column": number (0-based, optional)
}
If no issues, respond with: []`;

function buildUserPrompt(source: string, filePath: string): string {
  return `File: ${filePath}\n\nCode:\n\`\`\`\n${source}\n\`\`\`\n\nList security findings as a JSON array.`;
}

function extractJsonFromResponse(text: string): string {
  const trimmed = text.trim();
  const codeBlock = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  if (codeBlock) return codeBlock[1].trim();
  const start = trimmed.indexOf("[");
  if (start !== -1) {
    let depth = 0;
    let end = start;
    for (let i = start; i < trimmed.length; i++) {
      if (trimmed[i] === "[") depth++;
      else if (trimmed[i] === "]") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    return trimmed.slice(start, end);
  }
  return trimmed;
}

function parseFindings(
  raw: string,
  source: string,
  options: ScannerOptions,
  filePath?: string
): Finding[] {
  const findings: Finding[] = [];
  const jsonStr = extractJsonFromResponse(raw);
  if (!jsonStr || jsonStr === "[]") return findings;

  let arr: unknown[];
  try {
    arr = JSON.parse(jsonStr) as unknown[];
  } catch {
    return findings;
  }
  if (!Array.isArray(arr)) return findings;

  const order: Record<Severity, number> = { critical: 3, error: 2, warning: 1, info: 0 };
  const threshold: number = options.severityThreshold
    ? (order[options.severityThreshold] ?? 0)
    : 0;
  const lines = source.split("\n");

  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const severity = (o.severity as Severity) ?? "warning";
    if (order[severity] < threshold) continue;
    const category = (o.category as Category) ?? "injection";
    const line = typeof o.line === "number" ? Math.max(1, o.line) : 1;
    const column = typeof o.column === "number" ? o.column : 0;
    const finding: Finding = {
      ruleId: (o.ruleId as string) ?? "ai.finding",
      message: (o.message as string) ?? "Security concern",
      why: o.why as string | undefined,
      fix: o.fix as string | undefined,
      severity,
      severityLabel: SEVERITY_LABEL[severity],
      category,
      line,
      column,
      filePath,
      source: lines[line - 1],
    };
    findings.push(finding);
  }
  return findings;
}

export interface ScanWithAiResult {
  filePath: string;
  findings: Finding[];
  source: string;
}

// Run AI analysis: send code to the configured LLM and return findings. Uses options.ai or env SECURE_AI_API_URL, SECURE_AI_API_KEY.
export async function scanWithAi(
  source: string,
  filePath: string,
  options: ScannerOptions = {}
): Promise<ScanWithAiResult> {
  const aiOpts = options.ai ?? {};
  const apiUrl: string =
    (typeof aiOpts.apiUrl === "string" ? aiOpts.apiUrl : undefined) ??
    (typeof process !== "undefined" ? process.env?.SECURE_AI_API_URL : undefined) ??
    "https://api.openai.com/v1/chat/completions";
  const apiKey =
    aiOpts.apiKey ??
    (typeof process !== "undefined" && process.env?.SECURE_AI_API_KEY);
  if (!apiKey) {
    return {
      filePath,
      findings: [],
      source,
    };
  }

  const body = {
    model: aiOpts.model ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(source, filePath) },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content =
    data.choices?.[0]?.message?.content ?? "";
  const findings = parseFindings(content, source, options, filePath);

  return { filePath, findings, source };
}
