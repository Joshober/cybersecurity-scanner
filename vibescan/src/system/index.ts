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
export {
  escapeHtml,
  buildHtmlReport,
  projectScanToHtmlReport,
  projectJsonToHtmlReport,
  extractFindingsFromProjectJson,
} from "./htmlReport.js";
export type { HtmlReportFindingRow, HtmlReportMeta } from "./htmlReport.js";
export { formatProjectSarif, scanResultsToProjectForSarif } from "./sarif.js";
export type {
  Finding,
  ScanResult,
  ScannerOptions,
  Severity,
  SeverityLabel,
  Category,
  ScanMode,
  ProjectScanResult,
  RouteNode,
  RouteInventoryEntry,
  ProofGeneration,
  ProofHints,
} from "./types.js";
export { emitProofTests } from "./proof/pipeline.js";
export type { EmitProofTestsOptions } from "./proof/pipeline.js";
export type { Rule, RuleContext } from "./utils/rule-types.js";
