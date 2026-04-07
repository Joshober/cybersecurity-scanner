import { resolve, join } from "node:path";
import type { Severity, ScanMode, TsAnalysisMode } from "../types.js";
import type { OutputFormat } from "./vibescanConfig.js";

export interface ParsedCliArgs {
  subcommand: string;
  inputPaths: string[];
  configPathExplicit?: string;
  manifestPath?: string;
  adjudicationStem?: string;
  exportRoutesPath?: string;
  exportThirdPartySurfacePath?: string;
  aiAssistOutPath?: string;
  fixSuggestions: boolean;
  useColor: boolean;
  benchmarkMetadata: boolean;
  htmlReport: boolean;
  htmlOutPath?: string;
  baselineCliPath?: string;
  writeBaselinePath?: string;
  baselineIncludeKnown: boolean;
  baselineCliSet: boolean;
  writeBaselineSet: boolean;
  cliMerge: CliMergeOptions;
}

export interface CliMergeOptions {
  format?: OutputFormat;
  formatSet: boolean;
  excludeVendor: boolean;
  excludeVendorSet: boolean;
  severityThreshold?: Severity;
  severitySet: boolean;
  crypto: boolean;
  injection: boolean;
  rulesSet: boolean;
  checkRegistry: boolean;
  checkRegistrySet: boolean;
  skipRegistry: boolean;
  skipRegistrySet: boolean;
  projectRoot?: string;
  ignoreGlobs?: string[];
  ignoreGlobsSet: boolean;
  openApiSpecPaths: string[];
  openApiSpecPathsSet: boolean;
  openApiDiscovery: boolean;
  openApiDiscoverySet: boolean;
  buildId?: string;
  buildIdSet: boolean;
  tsAnalysis?: TsAnalysisMode;
  tsAnalysisSet: boolean;
  tsconfigPath?: string;
  tsconfigPathSet: boolean;
  tsFailOpen?: boolean;
  tsFailOpenSet: boolean;
  mode?: ScanMode;
  generateTests?: boolean;
  generateTestsDir?: string;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const result: ParsedCliArgs = {
    subcommand: "",
    inputPaths: [],
    fixSuggestions: false,
    useColor: process.stdout.isTTY ?? false,
    benchmarkMetadata: process.env.VIBESCAN_BENCHMARK === "1",
    htmlReport: false,
    baselineIncludeKnown: false,
    baselineCliSet: false,
    writeBaselineSet: false,
    cliMerge: {
      formatSet: false,
      excludeVendor: false,
      excludeVendorSet: false,
      severitySet: false,
      crypto: true,
      injection: true,
      rulesSet: false,
      checkRegistry: false,
      checkRegistrySet: false,
      skipRegistry: false,
      skipRegistrySet: false,
      ignoreGlobsSet: false,
      openApiSpecPaths: [],
      openApiSpecPathsSet: false,
      openApiDiscovery: true,
      openApiDiscoverySet: false,
      buildIdSet: false,
      tsAnalysisSet: false,
      tsconfigPathSet: false,
      tsFailOpenSet: false,
    },
  };

  const cm = result.cliMerge;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === "scan" || a === "report") {
      result.subcommand = a;
      continue;
    }

    switch (a) {
      case "--config":
        if (argv[i + 1]) result.configPathExplicit = resolve(argv[++i]);
        break;
      case "--manifest":
        if (argv[i + 1]) result.manifestPath = resolve(argv[++i]);
        break;
      case "--export-routes":
        if (argv[i + 1]) result.exportRoutesPath = resolve(argv[++i]);
        break;
      case "--export-third-party-surface":
        if (argv[i + 1]) result.exportThirdPartySurfacePath = resolve(argv[++i]);
        break;
      case "--export-adjudication":
        if (argv[i + 1]) result.adjudicationStem = argv[++i];
        break;
      case "--mode":
        if (argv[i + 1]) {
          const m = argv[++i].toLowerCase();
          if (m === "static" || m === "ai") cm.mode = m as ScanMode;
        }
        break;
      case "--ai-assist-out":
        if (argv[i + 1]) result.aiAssistOutPath = resolve(argv[++i]);
        break;
      case "--no-crypto":
        cm.crypto = false;
        cm.rulesSet = true;
        break;
      case "--no-injection":
        cm.injection = false;
        cm.rulesSet = true;
        break;
      case "--rules":
        if (argv[i + 1]) {
          const val = argv[++i].toLowerCase();
          cm.crypto = val.includes("crypto");
          cm.injection = val.includes("injection");
          cm.rulesSet = true;
        }
        break;
      case "--severity":
        if (argv[i + 1]) {
          const s = argv[++i].toLowerCase();
          if (["critical", "error", "warning", "info"].includes(s)) {
            cm.severityThreshold = s as Severity;
            cm.severitySet = true;
          }
        }
        break;
      case "--format":
        if (argv[i + 1]) {
          const f = argv[++i].toLowerCase();
          if (f === "json") cm.format = "json";
          else if (f === "sarif") cm.format = "sarif";
          else if (f === "human") cm.format = "human";
          else cm.format = "compact";
          cm.formatSet = true;
        }
        break;
      case "--fix-suggestions":
        result.fixSuggestions = true;
        break;
      case "--check-registry":
        cm.checkRegistry = true;
        cm.checkRegistrySet = true;
        break;
      case "--skip-registry":
        cm.skipRegistry = true;
        cm.skipRegistrySet = true;
        break;
      case "--exclude-vendor":
        cm.excludeVendor = true;
        cm.excludeVendorSet = true;
        break;
      case "--ignore-glob":
        if (argv[i + 1]) {
          cm.ignoreGlobs = cm.ignoreGlobs ?? [];
          cm.ignoreGlobs.push(argv[++i]);
          cm.ignoreGlobsSet = true;
        }
        break;
      case "--benchmark-metadata":
        result.benchmarkMetadata = true;
        break;
      case "--generate-tests":
        cm.generateTests = true;
        if (argv[i + 1] && !argv[i + 1].startsWith("-")) {
          cm.generateTestsDir = resolve(argv[++i]);
        } else {
          cm.generateTestsDir = join(process.cwd(), "vibescan-generated-tests");
        }
        break;
      case "--project-root":
        if (argv[i + 1]) cm.projectRoot = resolve(argv[++i]);
        break;
      case "--openapi-spec":
        if (argv[i + 1]) {
          cm.openApiSpecPaths.push(resolve(argv[++i]));
          cm.openApiSpecPathsSet = true;
        }
        break;
      case "--no-openapi-discovery":
        cm.openApiDiscovery = false;
        cm.openApiDiscoverySet = true;
        break;
      case "--build-id":
        if (argv[i + 1]) {
          cm.buildId = argv[++i];
          cm.buildIdSet = true;
        }
        break;
      case "--ts-analysis":
        if (argv[i + 1]) {
          const mode = argv[++i].toLowerCase();
          if (mode === "off" || mode === "auto" || mode === "semantic") {
            cm.tsAnalysis = mode as TsAnalysisMode;
            cm.tsAnalysisSet = true;
          }
        }
        break;
      case "--tsconfig":
        if (argv[i + 1]) {
          cm.tsconfigPath = argv[++i];
          cm.tsconfigPathSet = true;
        }
        break;
      case "--ts-fail-open":
        cm.tsFailOpen = true;
        cm.tsFailOpenSet = true;
        break;
      case "--no-ts-fail-open":
        cm.tsFailOpen = false;
        cm.tsFailOpenSet = true;
        break;
      case "--baseline":
        if (argv[i + 1]) {
          result.baselineCliPath = resolve(argv[++i]);
          result.baselineCliSet = true;
        }
        break;
      case "--write-baseline":
        if (argv[i + 1]) {
          result.writeBaselinePath = resolve(argv[++i]);
          result.writeBaselineSet = true;
        }
        break;
      case "--baseline-include-known":
        result.baselineIncludeKnown = true;
        break;
      case "--color":
        if (argv[i + 1]) {
          const v = argv[++i].toLowerCase();
          result.useColor = v === "always" ? true : v === "never" ? false : (process.stdout.isTTY ?? false);
        }
        break;
      case "--html":
        result.htmlReport = true;
        break;
      case "--html-out":
        if (argv[i + 1]) result.htmlOutPath = resolve(argv[++i]);
        break;
      default:
        if (!a.startsWith("-")) {
          if (result.subcommand === "scan" || result.subcommand === "report") {
            result.inputPaths.push(a);
          } else if (!result.subcommand) {
            result.subcommand = "scan";
            result.inputPaths.push(a);
          }
        }
        break;
    }
  }

  if (!result.subcommand || (result.subcommand === "scan" && result.inputPaths.length === 0)) {
    if (result.subcommand === "scan") result.inputPaths.push(".");
  }

  return result;
}
