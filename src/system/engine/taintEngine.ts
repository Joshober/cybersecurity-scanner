// Taint/data-flow analysis: tracks user input (sources) to dangerous sinks and reports unsanitized flow.

import type {
  CallExpression,
  MemberExpression,
  VariableDeclarator,
  AssignmentExpression,
  Node,
  Program,
} from "estree";
import { walk } from "../walker.js";
import type { Finding, ScannerOptions, Severity, SeverityLabel } from "../types.js";
import { getRequestSourceLabel } from "../sources/express.js";
import {
  getSqlSinkCallee,
  getCommandSinkCallee,
  getPathSinkCallee,
  getXpathSinkCallee,
  getLogSinkCallee,
} from "../sinks/index.js";
import { looksParameterized } from "../sanitizers/sql.js";

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

function getCalleeName(node: CallExpression): string | null {
  const callee = node.callee;
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    const obj = callee.object;
    if (obj.type === "Identifier") return `${obj.name}.${callee.property.name}`;
    if (
      obj.type === "MemberExpression" &&
      obj.property.type === "Identifier" &&
      obj.object.type === "Identifier"
    )
      return `${obj.object.name}.${obj.property.name}.${callee.property.name}`;
  }
  return null;
}

function getSourceLabelFromMember(node: MemberExpression): string | null {
  if (node.object.type === "Identifier" && node.property.type === "Identifier") {
    return getRequestSourceLabel(node.object.name, node.property.name, undefined);
  }
  if (
    node.object.type === "MemberExpression" &&
    node.object.object.type === "Identifier" &&
    node.object.property.type === "Identifier" &&
    node.property.type === "Identifier"
  ) {
    return getRequestSourceLabel(
      node.object.object.name,
      node.object.property.name,
      node.property.name
    );
  }
  return null;
}

function nodeKey(n: Node): number {
  return n.loc?.start?.line ?? 0 + (n.loc?.start?.column ?? 0) * 1e6;
}

export interface TaintEngineOptions {
  filePath: string;
  source: string;
  ast: Program;
  options: ScannerOptions;
}

// Run taint analysis: find sources, propagate taint, report when tainted data reaches sinks.
export function runTaintEngine(opts: TaintEngineOptions): Finding[] {
  const { source, ast, options } = opts;
  const findings: Finding[] = [];

  const sourceNodes = new Map<number, string>();
  const assignments: { node: VariableDeclarator | AssignmentExpression; key: number }[] = [];
  type SinkKind = "sql" | "command" | "path" | "xpath" | "log";
const sinkCalls: {
    node: CallExpression;
    sinkLabel: string;
    severity: "critical" | "error" | "warning";
    kind: SinkKind;
  }[] = [];

  walk(ast, (node) => {
    if (node.type === "MemberExpression") {
      const label = getSourceLabelFromMember(node);
      if (label) sourceNodes.set(nodeKey(node), label);
      return;
    }
    if (node.type === "VariableDeclarator") {
      assignments.push({ node, key: nodeKey(node) });
      return;
    }
    if (node.type === "AssignmentExpression" && node.left.type === "Identifier") {
      assignments.push({ node, key: nodeKey(node) });
      return;
    }
    if (node.type === "CallExpression") {
      const name = getCalleeName(node);
      if (!name) return;
      const [obj, method] = name.split(".");
      if (!method) return;
      const sqlSink = getSqlSinkCallee(obj, method);
      if (sqlSink) {
        sinkCalls.push({ node, sinkLabel: sqlSink, severity: "error", kind: "sql" });
        return;
      }
      const cmdSink = getCommandSinkCallee(obj, method);
      if (cmdSink) {
        sinkCalls.push({ node, sinkLabel: cmdSink, severity: "critical", kind: "command" });
        return;
      }
      const pathSink = getPathSinkCallee(obj, method);
      if (pathSink) {
        sinkCalls.push({ node, sinkLabel: pathSink, severity: "error", kind: "path" });
        return;
      }
      const xpathSink = getXpathSinkCallee(obj, method);
      if (xpathSink) {
        sinkCalls.push({ node, sinkLabel: xpathSink, severity: "error", kind: "xpath" });
        return;
      }
      const logSink = getLogSinkCallee(obj, method);
      if (logSink) {
        sinkCalls.push({ node, sinkLabel: logSink, severity: "warning", kind: "log" });
      }
    }
  });

  const tainted = new Map<string, string>();

  function exprIsSourceOrTainted(expr: Node): string | null {
    if (expr.type === "MemberExpression") {
      const k = nodeKey(expr);
      const label = sourceNodes.get(k);
      if (label) return label;
    }
    if (expr.type === "Identifier") {
      const src = tainted.get(expr.name);
      if (src) return src;
    }
    if (expr.type === "BinaryExpression" && expr.operator === "+") {
      const l = exprIsSourceOrTainted(expr.left);
      if (l) return l;
      return exprIsSourceOrTainted(expr.right) ?? null;
    }
    if (expr.type === "TemplateLiteral" && expr.expressions.length > 0) {
      for (const e of expr.expressions) {
        const t = exprIsSourceOrTainted(e);
        if (t) return t;
      }
    }
    return null;
  }

  function addTainted(idName: string, sourceLabel: string): void {
    if (!tainted.has(idName)) tainted.set(idName, sourceLabel);
  }

  assignments.sort((a, b) => a.key - b.key);
  for (const { node } of assignments) {
    if (node.type === "VariableDeclarator") {
      const id = node.id.type === "Identifier" ? node.id.name : null;
      const init = node.init;
      if (id && init) {
        const src = exprIsSourceOrTainted(init);
        if (src) addTainted(id, src);
      }
    } else if (node.type === "AssignmentExpression" && node.left.type === "Identifier") {
      const id = node.left.name;
      const src = exprIsSourceOrTainted(node.right);
      if (src) addTainted(id, src);
    }
  }

  const severityThreshold = options.severityThreshold
    ? SEVERITY_ORDER[options.severityThreshold]
    : 0;

  for (const { node, sinkLabel, severity, kind } of sinkCalls) {
    const findingSeverity =
      severity === "critical" ? 3 : severity === "error" ? 2 : 1;
    if (findingSeverity < severityThreshold) continue;

    const firstArg = node.arguments[0];
    if (!firstArg) continue;

    if (kind === "sql") {
      const queryLiteral =
        firstArg.type === "Literal" && typeof firstArg.value === "string"
          ? firstArg.value
          : "";
      const hasSecondArg = node.arguments.length > 1;
      if (looksParameterized(queryLiteral, hasSecondArg)) continue;
    }

    const sourceLabel = exprIsSourceOrTainted(firstArg);
    if (!sourceLabel) continue;

    const loc = node.loc;
    if (!loc) continue;

    const ruleId =
      kind === "command"
        ? "injection.command.tainted-flow"
        : kind === "sql"
          ? "injection.sql.tainted-flow"
          : kind === "xpath"
            ? "injection.xpath.tainted-flow"
            : kind === "log"
              ? "injection.log.tainted-flow"
              : "injection.path-traversal.tainted-flow";

    const message =
      ruleId === "injection.sql.tainted-flow"
        ? "SQL Injection risk"
        : ruleId === "injection.command.tainted-flow"
          ? "Command injection risk"
          : ruleId === "injection.xpath.tainted-flow"
            ? "XPath injection risk"
            : ruleId === "injection.log.tainted-flow"
              ? "Log injection risk"
              : "Path traversal risk";

    const finding: Finding = {
      ruleId,
      message,
      why:
        ruleId === "injection.sql.tainted-flow"
          ? "Untrusted input flows into a SQL query via string concatenation."
          : ruleId === "injection.log.tainted-flow"
            ? "Unsanitized input in logs can allow fake entries or impersonation via CR/LF."
            : "Untrusted input flows into a dangerous sink.",
      fix:
        ruleId === "injection.sql.tainted-flow"
          ? 'Use parameterized queries: db.query("SELECT * FROM users WHERE id=?", [id])'
          : ruleId === "injection.log.tainted-flow"
            ? "Sanitize log input: strip CR/LF; limit message size."
            : "Sanitize or allowlist user input before passing to this API.",
      severity:
        severity === "critical"
          ? "critical"
          : severity === "warning"
            ? "warning"
            : "error",
      severityLabel: SEVERITY_LABEL[severity] ?? "HIGH",
      category: "injection",
      sourceLabel,
      sinkLabel,
      line: loc.start.line,
      column: loc.start.column,
      endLine: loc.end?.line,
      endColumn: loc.end?.column,
      source: source.split("\n")[loc.start.line - 1],
    };
    findings.push(finding);
  }

  return findings;
}
