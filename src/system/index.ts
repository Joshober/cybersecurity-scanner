// secure-code-scanner: static analysis for crypto failures and injection in JS/TS. Use as CLI or ESLint plugin.

export { scan, scanAsync, cryptoRules, injectionRules } from "./scanner.js";
export { plugin as eslintPluginSecureCodeScanner } from "./eslint-plugin.js";
export { formatHuman, formatCompact, formatJson } from "./format.js";
export type { Finding, ScanResult, ScannerOptions, Severity, SeverityLabel, Category, ScanMode, AiAnalyzerOptions } from "./types.js";
export type { Rule, RuleContext } from "./utils/rule-types.js";
