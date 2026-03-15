// Pattern/rule-based detection: runs AST rules on the parsed tree and collects findings.

import type { Program } from "estree";
import type { Finding, ScannerOptions, Severity, SeverityLabel } from "../types.js";
import type { Rule } from "../utils/rule-types.js";
import { walk } from "../walker.js";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 3,
  error: 2,
  warning: 1,
  info: 0,
};
const SEVERITY_LABEL: Record<Severity, SeverityLabel> = {
  critical: "CRITICAL",
  error: "HIGH",
  warning: "MEDIUM",
  info: "LOW",
};

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ""));
}

function buildRuleContext(
  _filePath: string,
  source: string,
  findings: Finding[],
  options: ScannerOptions,
  rule: Rule
): import("../utils/rule-types.js").RuleContext {
  const report = (
    node: import("estree").Node,
    reportOptions?: import("../utils/rule-types.js").ReportOptions
  ) => {
    const loc = node.loc;
    if (!loc) return;
    const data = (reportOptions ?? {}) as Record<string, unknown>;
    const message =
      typeof data.message === "string" ? data.message : interpolate(rule.message, data);
    const why =
      typeof data.why === "string" ? data.why : (rule.why ? interpolate(rule.why, data) : undefined);
    const fix =
      typeof data.fix === "string" ? data.fix : (rule.fix ? interpolate(rule.fix, data) : undefined);
    const finding: Finding = {
      ruleId: rule.id,
      message,
      why,
      fix,
      severity: rule.severity,
      severityLabel: SEVERITY_LABEL[rule.severity],
      category: rule.category,
      line: loc.start.line,
      column: loc.start.column,
      endLine: loc.end?.line,
      endColumn: loc.end?.column,
      source: source.split("\n")[loc.start.line - 1],
    };
    const threshold = options.severityThreshold ? SEVERITY_ORDER[options.severityThreshold] : 0;
    if (SEVERITY_ORDER[rule.severity] >= threshold) {
      findings.push(finding);
    }
  };
  const getSource = (node: import("estree").Node) => {
    const loc = node.loc;
    if (!loc || !loc.end) return undefined;
    const lines = source.split("\n");
    if (loc.start.line === loc.end.line) {
      return lines[loc.start.line - 1]?.slice(loc.start.column, loc.end.column);
    }
    return lines
      .slice(loc.start.line - 1, loc.end.line)
      .join("\n")
      .slice(loc.start.column);
  };
  return { report, getSource };
}

function buildNodeTypeMap(rules: Rule[]): Map<string, Rule[]> {
  const map = new Map<string, Rule[]>();
  for (const rule of rules) {
    for (const type of rule.nodeTypes) {
      let list = map.get(type);
      if (!list) {
        list = [];
        map.set(type, list);
      }
      list.push(rule);
    }
  }
  return map;
}

export interface RunRuleEngineOptions {
  filePath: string;
  source: string;
  ast: Program;
  rules: Rule[];
  options: ScannerOptions;
}

// Run pattern rules on an AST and return findings.
export function runRuleEngine(opts: RunRuleEngineOptions): Finding[] {
  const { filePath, source, ast, rules, options } = opts;
  const findings: Finding[] = [];
  const nodeTypeMap = buildNodeTypeMap(rules);

  walk(ast, (node) => {
    const ruleList = nodeTypeMap.get(node.type);
    if (!ruleList) return;
    for (const rule of ruleList) {
      const context = buildRuleContext(filePath, source, findings, options, rule);
      try {
        rule.check(context, node);
      } catch {
        // Skip reporting when a rule throws.
      }
    }
  });

  return findings;
}

export { SEVERITY_ORDER, SEVERITY_LABEL };
