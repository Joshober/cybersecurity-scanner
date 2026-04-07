import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { ScannerOptions, Severity, TsAnalysisMode } from "../types.js";

export type OutputFormat = "human" | "compact" | "json" | "sarif";

export interface SuppressionRule {
  ruleId?: string;
  file?: string;
  line?: number;
  /** Audit trail: why this suppression is acceptable (recommended in regulated teams). */
  reason?: string;
}

export interface VibeScanFileConfig {
  schemaVersion?: string;
  rules?: { crypto?: boolean; injection?: boolean };
  severityThreshold?: Severity;
  ignore?: string[];
  excludeVendor?: boolean;
  format?: OutputFormat;
  registry?: { checkRegistry?: boolean; skipRegistry?: boolean };
  suppressions?: SuppressionRule[];
  /** Absolute or project-relative OpenAPI/Swagger paths (disables discovery). */
  openApiSpecPaths?: string[];
  /** When false, do not auto-discover openapi.* / swagger.* under project root. */
  openApiDiscovery?: boolean;
  /** Echoed in JSON output and run manifests for deployment correlation. */
  buildId?: string;
  /** TypeScript semantic analysis controls. */
  tsAnalysis?: TsAnalysisMode;
  tsconfigPath?: string;
  tsFailOpen?: boolean;
  /** Defaults for `vibescan export-ai-rules` when CLI flags are omitted. */
  aiExport?: {
    tool?: "cursor" | "amazonq";
    /** secure-arch settings dir relative to project root */
    settings?: string;
  };
  /** When set (or overridden by CLI --baseline), findings matching this file do not fail the run. */
  baseline?: string;
}

export interface MergedCliConfig {
  scanner: ScannerOptions;
  format: OutputFormat;
  suppressions: SuppressionRule[];
  /** Project-relative or absolute path to baseline JSON (optional). */
  baseline?: string;
}

function parseConfigJson(text: string): VibeScanFileConfig {
  const raw = JSON.parse(text) as unknown;
  if (!raw || typeof raw !== "object") return {};
  return raw as VibeScanFileConfig;
}

/** Walk upward from startDir looking for vibescan.config.json */
export function findVibeScanConfigFile(startDir: string): string | null {
  let dir = resolve(startDir);
  for (;;) {
    const candidate = join(dir, "vibescan.config.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function loadVibeScanConfigFile(path: string): VibeScanFileConfig {
  const text = readFileSync(path, "utf-8");
  return parseConfigJson(text);
}

/** Map file config + explicit CLI overrides into scanner options and format. */
export function mergeVibeScanConfig(
  file: VibeScanFileConfig | null,
  cli: {
    format?: OutputFormat;
    formatSet?: boolean;
    excludeVendor?: boolean;
    excludeVendorSet?: boolean;
    severityThreshold?: Severity;
    severitySet?: boolean;
    crypto?: boolean;
    injection?: boolean;
    rulesSet?: boolean;
    checkRegistry?: boolean;
    checkRegistrySet?: boolean;
    skipRegistry?: boolean;
    skipRegistrySet?: boolean;
    projectRoot?: string;
    ignoreGlobs?: string[];
    ignoreGlobsSet?: boolean;
    openApiSpecPaths?: string[];
    openApiSpecPathsSet?: boolean;
    openApiDiscovery?: boolean;
    openApiDiscoverySet?: boolean;
    buildId?: string;
    buildIdSet?: boolean;
    baseline?: string;
    baselineSet?: boolean;
    tsAnalysis?: TsAnalysisMode;
    tsAnalysisSet?: boolean;
    tsconfigPath?: string;
    tsconfigPathSet?: boolean;
    tsFailOpen?: boolean;
    tsFailOpenSet?: boolean;
  },
  baseScanner: ScannerOptions
): MergedCliConfig {
  const scanner: ScannerOptions = { ...baseScanner };
  let format: OutputFormat = "compact";
  const suppressions: SuppressionRule[] = [...(file?.suppressions ?? [])];
  let baseline: string | undefined = file?.baseline;

  if (file?.rules) {
    if (file.rules.crypto !== undefined) scanner.crypto = file.rules.crypto;
    if (file.rules.injection !== undefined) scanner.injection = file.rules.injection;
  }
  if (file?.severityThreshold) scanner.severityThreshold = file.severityThreshold;
  if (file && typeof file.excludeVendor === "boolean") scanner.excludeVendor = file.excludeVendor;
  if (file?.ignore?.length) scanner.ignoreGlobs = [...file.ignore];
  if (file?.registry) {
    if ("checkRegistry" in file.registry) scanner.checkRegistry = !!file.registry.checkRegistry;
    if ("skipRegistry" in file.registry) scanner.skipRegistry = !!file.registry.skipRegistry;
  }
  if (file?.openApiSpecPaths?.length) {
    scanner.openApiSpecPaths = [...file.openApiSpecPaths];
  }
  if (file && typeof file.openApiDiscovery === "boolean") {
    scanner.openApiDiscovery = file.openApiDiscovery;
  }
  if (file?.buildId) scanner.buildId = file.buildId;
  if (file?.tsAnalysis) scanner.tsAnalysis = file.tsAnalysis;
  if (file?.tsconfigPath) scanner.tsconfigPath = file.tsconfigPath;
  if (typeof file?.tsFailOpen === "boolean") scanner.tsFailOpen = file.tsFailOpen;
  if (file?.format) format = file.format;

  if (cli.rulesSet && cli.crypto !== undefined && cli.injection !== undefined) {
    scanner.crypto = cli.crypto;
    scanner.injection = cli.injection;
  }
  if (cli.severitySet && cli.severityThreshold !== undefined) {
    scanner.severityThreshold = cli.severityThreshold;
  }
  if (cli.excludeVendorSet) scanner.excludeVendor = !!cli.excludeVendor;
  if (cli.ignoreGlobsSet && cli.ignoreGlobs !== undefined) {
    scanner.ignoreGlobs = [...cli.ignoreGlobs];
  }
  if (cli.checkRegistrySet && cli.checkRegistry !== undefined) {
    scanner.checkRegistry = cli.checkRegistry;
  }
  if (cli.skipRegistrySet && cli.skipRegistry !== undefined) {
    scanner.skipRegistry = cli.skipRegistry;
  }
  if (cli.projectRoot) scanner.projectRoot = cli.projectRoot;
  if (cli.openApiSpecPathsSet && cli.openApiSpecPaths !== undefined) {
    scanner.openApiSpecPaths = [...cli.openApiSpecPaths];
  }
  if (cli.openApiDiscoverySet && cli.openApiDiscovery !== undefined) {
    scanner.openApiDiscovery = cli.openApiDiscovery;
  }
  if (cli.buildIdSet && cli.buildId !== undefined) {
    scanner.buildId = cli.buildId;
  }
  if (cli.tsAnalysisSet && cli.tsAnalysis !== undefined) {
    scanner.tsAnalysis = cli.tsAnalysis;
  }
  if (cli.tsconfigPathSet && cli.tsconfigPath !== undefined) {
    scanner.tsconfigPath = cli.tsconfigPath;
  }
  if (cli.tsFailOpenSet && cli.tsFailOpen !== undefined) {
    scanner.tsFailOpen = cli.tsFailOpen;
  }
  if (cli.formatSet && cli.format !== undefined) format = cli.format;
  if (cli.baselineSet && cli.baseline !== undefined) baseline = cli.baseline;

  return { scanner, format, suppressions, baseline };
}
