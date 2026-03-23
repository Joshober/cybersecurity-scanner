// VibeScan: static analysis for crypto failures and injection in JS/TS. Use as CLI or ESLint plugin.

export {
  scan,
  scanAsync,
  scanProject,
  scanProjectAsync,
  cryptoRules,
  injectionRules,
} from "./scanner.js";
export { plugin as eslintPluginSecureCodeScanner } from "./eslint-plugin.js";
export {
  formatHuman,
  formatCompact,
  formatJson,
  formatProjectJson,
  projectFindingsToScanResults,
  summarizeFindings,
  findingToJson,
  findingDisplayFile,
} from "./format.js";
export type { FindingsSummary } from "./format.js";
export { formatProjectSarif, scanResultsToProjectForSarif } from "./sarif.js";
export type {
  Finding,
  ScanResult,
  ScannerOptions,
  Severity,
  SeverityLabel,
  Category,
  ScanMode,
  AiAnalyzerOptions,
  ProjectScanResult,
  RouteNode,
  RouteInventoryEntry,
} from "./types.js";
export type { Rule, RuleContext } from "./utils/rule-types.js";
