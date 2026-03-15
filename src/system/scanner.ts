// Main scan pipeline: parse, then pattern rules, then taint analysis.

import type { Finding, ScannerOptions, ScanResult } from "./types.js";
import type { Rule } from "./utils/rule-types.js";
import { parseFile } from "./parser/parseFile.js";
import { runRuleEngine, runTaintEngine } from "./engine/index.js";
import { cryptoRules, injectionRules } from "../attacks/index.js";
import { scanWithAi } from "./ai/ai-analyzer.js";

function getRules(options: ScannerOptions): Rule[] {
  const rules: Rule[] = [];
  if (options.crypto !== false) rules.push(...cryptoRules);
  if (options.injection !== false) rules.push(...injectionRules);
  return rules;
}

// Scan one file: parse to AST, run pattern rules (crypto misuse, dangerous APIs), then taint analysis (sources to sinks).
export function scan(
  source: string,
  filePath: string,
  options: ScannerOptions = {}
): ScanResult {
  const parseResult = parseFile(source);
  if (!parseResult) {
    return { filePath, findings: [], source };
  }
  const { ast, source: src } = parseResult;
  const rules = getRules(options);

  const patternFindings: Finding[] = runRuleEngine({
    filePath,
    source: src,
    ast,
    rules,
    options,
  });

  const taintFindings: Finding[] =
    options.injection !== false
      ? runTaintEngine({
          filePath,
          source: src,
          ast,
          options,
        })
      : [];

  const findings = [...patternFindings, ...taintFindings];
  return { filePath, findings, source: src };
}

// Async scan: when mode is "ai" runs AI analysis; otherwise same result as sync scan().
export async function scanAsync(
  source: string,
  filePath: string,
  options: ScannerOptions = {}
): Promise<ScanResult> {
  if (options.mode === "ai") {
    return scanWithAi(source, filePath, options);
  }
  return Promise.resolve(scan(source, filePath, options));
}

export { cryptoRules, injectionRules } from "../attacks/index.js";
