// Severity level for a finding (internal). Maps to checklist: error → HIGH, warning → MEDIUM.
export type Severity = "critical" | "error" | "warning" | "info";

// Human-facing severity label for output.
export type SeverityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Category of security issue.
export type Category = "crypto" | "injection" | "api_inventory";

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

/** Optional route context on graph-derived findings (JSON / SARIF consumers). */
export interface FindingRouteRef {
  method: "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  fullPath: string;
  middlewares: string[];
}

// Express-style route extracted for middleware audit and tooling.
export interface RouteNode {
  method: "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
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
  /** When the finding is tied to an extracted Express route. */
  route?: FindingRouteRef;
  /** Static hints for local proof-oriented test generation (deterministic; no remote calls). */
  proofHints?: ProofHints;
  /** Result of proof-oriented test generation when the pipeline ran (see `emitProofTests`). */
  proofGeneration?: ProofGeneration;
}

/** Scanner-populated hints for generated proof tests (optional per rule). */
export interface ProofHints {
  /** Weak JWT signing secret literal from pattern rule `crypto.jwt.weak-secret-literal`. */
  weakJwtSecretLiteral?: string;
}

/** Outcome of local proof-oriented test generation for one finding. */
export interface ProofGeneration {
  status: "provable_locally" | "needs_manual_completion" | "unsupported";
  wasGenerated: boolean;
  generatedPath?: string;
  autoFilled: string[];
  manualNeeded: string[];
  notes?: string;
  generatorId: string;
}

/** `static` = rule-based scan only. `ai` = same scan + writes an IDE paste-in prompt (Cursor / Claude Code); no remote API. */
export type ScanMode = "static" | "ai";

// Options for the scanner.
export interface ScannerOptions {
  filePath?: string;
  severityThreshold?: Severity;
  crypto?: boolean;
  injection?: boolean;
  mode?: ScanMode;
  /** npm registry slopsquat check (CLI: --check-registry). */
  checkRegistry?: boolean;
  skipRegistry?: boolean;
  /** After scan, emit generated tests under this directory. */
  generateTests?: boolean;
  generateTestsOutputDir?: string;
  /** Workspace root for package.json / multi-file route graph. */
  projectRoot?: string;
  /** Skip common vendor/minified paths when collecting files (CLI: --exclude-vendor). */
  excludeVendor?: boolean;
  /** Extra glob patterns to ignore when collecting files (from config). */
  ignoreGlobs?: string[];
  /** Absolute paths to OpenAPI/Swagger specs (disables discovery when set). */
  openApiSpecPaths?: string[];
  /** When true (default), discover openapi/swagger.* under projectRoot. */
  openApiDiscovery?: boolean;
  /** Optional build/deploy id for run metadata (JSON output / manifests). */
  buildId?: string;
}

// Result of scanning a file.
export interface ScanResult {
  filePath: string;
  findings: Finding[];
  source?: string;
  routes?: RouteNode[];
}

/** Enriched route row for trust-boundary / inventory reporting. */
export interface RouteInventoryEntry {
  method: RouteNode["method"];
  path: string;
  fullPath: string;
  file: string;
  line: number;
  middlewares: string[];
  /** Heuristic risk tags, e.g. admin, auth-sensitive, upload, webhook. */
  tags: string[];
  sensitivePath: boolean;
  adminPath: boolean;
  objectScoped: boolean;
  hasAuthMiddleware: boolean;
}

/** Aggregated workspace scan (CLI / scanProject). */
export interface ProjectScanResult {
  fileResults: ScanResult[];
  routes: RouteNode[];
  findings: Finding[];
  packageJsonPath?: string;
  /** OpenAPI spec files used for drift analysis (if any). */
  openApiSpecsUsed?: string[];
  /** Labeled route inventory when project scan runs. */
  routeInventory?: RouteInventoryEntry[];
  /** Echo of optional ScannerOptions.buildId. */
  buildId?: string;
}
