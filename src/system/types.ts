// Severity level for a finding (internal).
export type Severity = "critical" | "error" | "warning" | "info";

// Human-facing severity label for output.
export type SeverityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Category of security issue.
export type Category = "crypto" | "injection";

// A single finding from the scanner: why it was flagged and how to fix it.
export interface Finding {
  ruleId: string;
  message: string;
  // Explanation of why this is a risk (for output).
  why?: string;
  // Concrete fix guidance (for output and --fix-suggestions).
  fix?: string;
  severity: Severity;
  // CRITICAL / HIGH / MEDIUM / LOW for display.
  severityLabel: SeverityLabel;
  category: Category;
  // Taint finding: untrusted source (e.g. req.query.id).
  sourceLabel?: string;
  // Taint finding: dangerous sink (e.g. db.query).
  sinkLabel?: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  source?: string;
}

// Scan engine: static (AST rules) or AI (LLM reads code and responds).
export type ScanMode = "static" | "ai";

// Options for AI-based analysis (used when mode is "ai").
export interface AiAnalyzerOptions {
  // API endpoint (e.g. OpenAI-compatible chat completions).
  apiUrl?: string;
  // API key (or set SECURE_AI_API_KEY env var).
  apiKey?: string;
  // Model name (e.g. gpt-4o-mini).
  model?: string;
}

// Options for the scanner.
export interface ScannerOptions {
  // File path (for source snippets).
  filePath?: string;
  // Severity threshold: only report this and above.
  severityThreshold?: Severity;
  // Enable/disable rule categories (static mode only).
  crypto?: boolean;
  injection?: boolean;
  // Engine: "static" = rule-based AST checks; "ai" = LLM. Default "static".
  mode?: ScanMode;
  // Options for AI analyzer (used when mode is "ai").
  ai?: AiAnalyzerOptions;
}

// Result of scanning a file.
export interface ScanResult {
  filePath: string;
  findings: Finding[];
  source?: string;
}
