// Severity level for a finding (internal). Maps to checklist: error → HIGH, warning → MEDIUM.
export type Severity = "critical" | "error" | "warning" | "info";

// Human-facing severity label for output.
export type SeverityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Category of security issue.
export type Category = "crypto" | "injection";

/** OWASP Top 10 style id, e.g. A03:2021 */
export type OwaspId = string;

/** Display / machine label for formatter (checklist Block 14). */
export type FindingKind =
  | "SLOPSQUAT_CANDIDATE"
  | "POSSIBLY_PRIVATE"
  | "INSUFFICIENT_SSRF_DEFENSE"
  | "PROTOTYPE_POLLUTION"
  | "ENV_FALLBACK"
  | "MIDDLEWARE_MISSING"
  | "APP_CONFIG"
  | string;

// Express-style route extracted for middleware audit and tooling.
export interface RouteNode {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  fullPath: string;
  params: string[];
  bodyFields: string[];
  queryFields: string[];
  paramsFields: string[];
  middlewares: string[];
  file: string;
  line: number;
  handlerSource: string;
}

// A single finding from the scanner: why it was flagged and how to fix it.
export interface Finding {
  ruleId: string;
  message: string;
  why?: string;
  fix?: string;
  /** One-line remediation (checklist); falls back to fix in formatters when absent. */
  remediation?: string;
  severity: Severity;
  severityLabel: SeverityLabel;
  category: Category;
  cwe?: number;
  owasp?: OwaspId;
  cveRef?: string[];
  findingKind?: FindingKind;
  generatedTest?: string;
  sourceLabel?: string;
  sinkLabel?: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  source?: string;
  /** When the finding targets another file (e.g. route middleware audit). */
  filePath?: string;
  /** npm dependency name for registry-based findings (slopsquat). */
  packageName?: string;
}

// Scan engine: static (AST rules) or AI (LLM reads code and responds).
export type ScanMode = "static" | "ai";

// Options for AI-based analysis (used when mode is "ai").
export interface AiAnalyzerOptions {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}

// Options for the scanner.
export interface ScannerOptions {
  filePath?: string;
  severityThreshold?: Severity;
  crypto?: boolean;
  injection?: boolean;
  mode?: ScanMode;
  ai?: AiAnalyzerOptions;
  /** npm registry slopsquat check (CLI: --check-registry). */
  checkRegistry?: boolean;
  skipRegistry?: boolean;
  /** After scan, emit generated tests under this directory. */
  generateTests?: boolean;
  generateTestsOutputDir?: string;
  /** Workspace root for package.json / multi-file route graph. */
  projectRoot?: string;
}

// Result of scanning a file.
export interface ScanResult {
  filePath: string;
  findings: Finding[];
  source?: string;
  routes?: RouteNode[];
}

/** Aggregated workspace scan (CLI / scanProject). */
export interface ProjectScanResult {
  fileResults: ScanResult[];
  routes: RouteNode[];
  findings: Finding[];
  packageJsonPath?: string;
}
