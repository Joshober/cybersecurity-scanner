// Severity level for a finding (internal). Maps to checklist: error → HIGH, warning → MEDIUM.
export type Severity = "critical" | "error" | "warning" | "info";

// Human-facing severity label for output.
export type SeverityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Category of security issue.
export type Category = "crypto" | "injection" | "api_inventory" | "third_party";

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
  /** Human-readable notes on middleware order or recognized controls. */
  middlewareEvidence?: string[];
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
  /** Declared harness contract for generated proofs (from generator metadata). */
  proofHarness?: ProofHarnessMeta;
  /** When the finding comes from OpenAPI reconciliation (e.g. API-AUTH-001). */
  openApiSecurity?: {
    schemeRefs: string[];
    schemeKinds: string[];
    specFile?: string;
    pathTemplate?: string;
  };
  /** Optional structured signals for confidence scoring (set by engines when available). */
  evidenceSignals?: {
    sanitization?: "none" | "partial" | "parameterized" | "unknown";
  };
}

/** Scanner-populated hints for generated proof tests (optional per rule). */
export interface ProofHints {
  /** Weak JWT signing secret literal from pattern rule `crypto.jwt.weak-secret-literal`. */
  weakJwtSecretLiteral?: string;
}

/** String tier for JSON / benchmarks (maps from numeric proofCoverageTier). */
export type ProofTierLabel = "provable" | "partial" | "structural" | "detection_only";

/**
 * Structured proof failure (see `proof/taxonomy.ts`).
 * Set by generators when status is unsupported or needs_manual_completion.
 */
export type ProofFailureCode =
  | "unknown"
  | "unresolved_dynamic_dispatch"
  | "unresolved_import"
  | "runtime_route_registration"
  | "external_dependency_required"
  | "missing_auth_context"
  | "environment_secret_required"
  | "dynamic_url_unresolved";

/** Optional detail when proof cannot complete. */
export interface ProofFailureDetail {
  evidence: string[];
  manualSteps: string[];
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
  /** Machine-readable boundary when proof is partial or unavailable (JSON export). */
  failureReason?: string;
  /** Classified reason when proof is partial or unsupported. */
  failureCode?: ProofFailureCode;
  failureDetail?: ProofFailureDetail;
  /**
   * Local proof is repeatable without network (heuristic; generators may set).
   * When omitted and a `.test.mjs` was emitted for provable_locally, treated as true in metrics.
   */
  deterministic?: boolean;
  /** Proof needs network access to validate (heuristic). */
  requiresNetwork?: boolean;
  /** Proof needs secrets from environment (heuristic). */
  requiresSecrets?: boolean;
  /** Proof depends on non-secret environment variables (e.g. NODE_ENV). */
  requiresEnv?: boolean;
}

/** How the proof test isolates behavior (for JSON / CI metadata). */
export type ProofHarnessIsolation = "mock" | "pure";

/** Optional metadata attached by proof generators. */
export interface ProofHarnessMeta {
  isolation: ProofHarnessIsolation;
  notes?: string;
}

/** `static` = rule-based scan only. `ai` = same scan + writes an IDE paste-in prompt (Cursor / Claude Code); no remote API. */
export type ScanMode = "static" | "ai";

/** TypeScript analysis mode for project-aware semantic scanning. */
export type TsAnalysisMode = "off" | "auto" | "semantic";

/** Visible non-fatal scan/runtime warning surfaced in CLI and JSON output. */
export interface ScanWarning {
  code: string;
  message: string;
  filePath?: string;
}

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
  /** `off` = current behavior, `auto` = semantic when tsconfig is available, `semantic` = require TS project setup. */
  tsAnalysis?: TsAnalysisMode;
  /** Optional explicit tsconfig path (project-relative or absolute in CLI/config). */
  tsconfigPath?: string;
  /** When true, continue with syntax-only TS parsing if semantic project creation fails. */
  tsFailOpen?: boolean;
}

// Result of scanning a file.
export interface ScanResult {
  filePath: string;
  findings: Finding[];
  source?: string;
  routes?: RouteNode[];
  warnings?: ScanWarning[];
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

export type DependencyKind =
  | "dependency"
  | "devDependency"
  | "peerDependency"
  | "optionalDependency"
  | "unknown";

export type ThirdPartyImportKind =
  | "default"
  | "named"
  | "namespace"
  | "require"
  | "destructured-require"
  | "side-effect"
  | "re-export"
  | "dynamic-import";

export interface ThirdPartyImportSpecifier {
  kind: ThirdPartyImportKind;
  localName?: string;
  importedName?: string;
}

export interface ThirdPartyImportEdge {
  filePath: string;
  packageName: string;
  moduleSpecifier: string;
  line: number;
  dependencyKind: DependencyKind;
  specifiers: ThirdPartyImportSpecifier[];
  importedBindings: string[];
  usageCount: number;
  callCount: number;
}

export interface ThirdPartyRouteTouchpoint {
  packageName: string;
  filePath: string;
  method: RouteNode["method"];
  path: string;
  fullPath: string;
  line: number;
  tags: string[];
  importedBindings: string[];
}

export interface ThirdPartyFindingTouchpoint {
  packageName: string;
  filePath: string;
  ruleId: string;
  severity: Severity;
  line: number;
  sourceLabel?: string;
  sinkLabel?: string;
  importedBindings: string[];
}

export interface ThirdPartyPackageSurface {
  packageName: string;
  dependencyKinds: DependencyKind[];
  files: string[];
  importedBindings: string[];
  importEdges: ThirdPartyImportEdge[];
  routeTouchpoints: ThirdPartyRouteTouchpoint[];
  findingTouchpoints: ThirdPartyFindingTouchpoint[];
  riskLabels: string[];
  highestSeverity: Severity;
}

export interface ThirdPartySurfaceSummary {
  packageCount: number;
  importEdgeCount: number;
  routeTouchpointCount: number;
  sensitiveRouteTouchpointCount: number;
  findingTouchpointCount: number;
  taintedFlowTouchpointCount: number;
  reviewFindingCount: number;
}

export interface ThirdPartySurfaceReport {
  packageJsonPath?: string;
  summary: ThirdPartySurfaceSummary;
  imports: ThirdPartyImportEdge[];
  packages: ThirdPartyPackageSurface[];
  reviewFindings: Finding[];
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
  /** Deterministic third-party package inventory and touchpoints. */
  thirdPartySurface?: ThirdPartySurfaceReport;
  /** Echo of optional ScannerOptions.buildId. */
  buildId?: string;
  /** Visible scan warnings, including TypeScript semantic fallback notices. */
  warnings?: ScanWarning[];
}
