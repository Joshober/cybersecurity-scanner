// Pattern/rule-based detection: runs AST rules on the parsed tree and collects findings.

import type { Program } from "estree";
import type { Finding, ProofHints, ScannerOptions, Severity, SeverityLabel } from "../types.js";
import type { ParseResult } from "../parser/parseFile.js";
import type { Rule } from "../utils/rule-types.js";
import { buildParentMap, walk } from "../walker.js";
import { getResolvedCall, getTypeText } from "../typescript/semantic.js";

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
  filePath: string,
  source: string,
  findings: Finding[],
  options: ScannerOptions,
  rule: Rule,
  parentMap: WeakMap<import("estree").Node, import("estree").Node | null>,
  parseResult?: ParseResult | null
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
    const remediation =
      typeof data.remediation === "string"
        ? data.remediation
        : rule.remediation
          ? interpolate(rule.remediation, data)
          : undefined;
    const cwe = typeof data.cwe === "number" ? data.cwe : rule.cwe;
    const owasp = typeof data.owasp === "string" ? data.owasp : rule.owasp;
    const cveRef = Array.isArray(data.cveRef) ? (data.cveRef as string[]) : undefined;
    const findingKind =
      typeof data.findingKind === "string" ? data.findingKind : undefined;
    const generatedTest =
      typeof data.generatedTest === "string" ? data.generatedTest : undefined;
    const proofHints =
      data.proofHints && typeof data.proofHints === "object" && !Array.isArray(data.proofHints)
        ? (data.proofHints as ProofHints)
        : undefined;

    const finding: Finding = {
      ruleId: rule.id,
      message,
      why,
      fix,
      remediation,
      severity: rule.severity,
      severityLabel: SEVERITY_LABEL[rule.severity],
      category: rule.category,
      cwe,
      owasp,
      cveRef,
      findingKind,
      generatedTest,
      proofHints,
      line: loc.start.line,
      column: loc.start.column,
      endLine: loc.end?.line,
      endColumn: loc.end?.column,
      filePath,
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
  const getParent = (node: import("estree").Node) => parentMap.get(node) ?? null;
  const getResolvedCallee = (node: import("estree").Node) =>
    node.type === "CallExpression" ? getResolvedCall(parseResult, node) : null;
  const getTypeTextForNode = (node: import("estree").Node) => getTypeText(parseResult, node);
  return { report, getSource, getParent, getResolvedCallee, getTypeText: getTypeTextForNode };
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
  parseResult?: ParseResult | null;
}

// Run pattern rules on an AST and return findings.
export function runRuleEngine(opts: RunRuleEngineOptions): Finding[] {
  const { filePath, source, ast, rules, options, parseResult } = opts;
  const findings: Finding[] = [];
  const nodeTypeMap = buildNodeTypeMap(rules);
  const parentMap = buildParentMap(ast as import("estree").Node);

  walk(ast, (node) => {
    const ruleList = nodeTypeMap.get(node.type);
    if (!ruleList) return;
    for (const rule of ruleList) {
      const context = buildRuleContext(filePath, source, findings, options, rule, parentMap, parseResult);
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
