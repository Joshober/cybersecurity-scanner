// Taint/data-flow analysis: tracks user input (sources) to dangerous sinks and reports unsanitized flow.

import type {
  CallExpression,
  Expression,
  MemberExpression,
  VariableDeclarator,
  AssignmentExpression,
  Node,
  Program,
  ObjectPattern,
} from "estree";
import ts from "typescript";
import { walk } from "../walker.js";
import type { Finding, ScannerOptions, Severity, SeverityLabel } from "../types.js";
import type { ParseResult } from "../parser/parseFile.js";
import { describeCalleeName } from "../utils/helpers.js";
import { getRequestSourceLabel } from "../sources/express.js";
import {
  isAxiosCallExpression,
  matchKnownSink,
  type KnownSinkKind,
} from "../sinks/index.js";
import { looksParameterized } from "../sanitizers/sql.js";
import { getCallResolution, getSymbolDeclarationForCall } from "../typescript/semantic.js";

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
  const line = n.loc?.start.line ?? 0;
  const col = n.loc?.start.column ?? 0;
  return line * 1e6 + col;
}

function callArg(node: CallExpression, i: number): Expression | undefined {
  const a = node.arguments[i];
  if (!a || a.type === "SpreadElement") return undefined;
  return a as Expression;
}

function getAxiosUrlExpression(node: CallExpression): Expression | null {
  const arg0 = node.arguments[0];
  if (!arg0 || arg0.type !== "ObjectExpression") return null;
  for (const prop of arg0.properties) {
    if (prop.type !== "Property") continue;
    const key = prop.key;
    const isUrl =
      (key.type === "Identifier" && key.name === "url") ||
      (key.type === "Literal" && key.value === "url");
    if (isUrl) return prop.value as Expression;
  }
  return null;
}

export interface TaintEngineOptions {
  filePath: string;
  source: string;
  ast: Program;
  options: ScannerOptions;
  parseResult?: ParseResult | null;
}

function unwrapExpression(node: Node): Node {
  let current: { type: string; expression?: Node; argument?: Node } = node as unknown as {
    type: string;
    expression?: Node;
    argument?: Node;
  };
  for (;;) {
    if (
      current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ChainExpression"
    ) {
      if (!current.expression) return current as unknown as Node;
      current = current.expression as unknown as {
        type: string;
        expression?: Node;
        argument?: Node;
      };
      continue;
    }
    if (current.type === "AwaitExpression") {
      if (!current.argument) return current as unknown as Node;
      current = current.argument as unknown as {
        type: string;
        expression?: Node;
        argument?: Node;
      };
      continue;
    }
    return current as unknown as Node;
  }
}

function addDestructuredTaint(
  pattern: ObjectPattern,
  sourceLabel: string,
  addTainted: (idName: string, sourceLabel: string) => void
): void {
  for (const prop of pattern.properties) {
    if (prop.type !== "Property") continue;
    const key =
      prop.key.type === "Identifier"
        ? prop.key.name
        : prop.key.type === "Literal" && typeof prop.key.value === "string"
          ? prop.key.value
          : null;
    if (!key) continue;
    if (prop.value.type === "Identifier") {
      addTainted(prop.value.name, `${sourceLabel}.${key}`);
      continue;
    }
    if (prop.value.type === "AssignmentPattern" && prop.value.left.type === "Identifier") {
      addTainted(prop.value.left.name, `${sourceLabel}.${key}`);
    }
  }
}

function tsExpressionUsesParam(node: ts.Node | undefined, paramNames: Set<string>): string | null {
  if (!node) return null;
  if (ts.isIdentifier(node) && paramNames.has(node.text)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return tsExpressionUsesParam(node.expression, paramNames);
  if (ts.isElementAccessExpression(node)) return tsExpressionUsesParam(node.expression, paramNames);
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node)) {
    return tsExpressionUsesParam(node.expression, paramNames);
  }
  if (ts.isParenthesizedExpression(node)) return tsExpressionUsesParam(node.expression, paramNames);
  if (ts.isAwaitExpression(node)) return tsExpressionUsesParam(node.expression, paramNames);
  if (ts.isBinaryExpression(node)) {
    return tsExpressionUsesParam(node.left, paramNames) ?? tsExpressionUsesParam(node.right, paramNames);
  }
  if (ts.isTemplateExpression(node)) {
    for (const span of node.templateSpans) {
      const match = tsExpressionUsesParam(span.expression, paramNames);
      if (match) return match;
    }
    return null;
  }
  if (ts.isCallExpression(node)) {
    const match = tsExpressionUsesParam(node.expression, paramNames);
    if (match) return match;
    for (const arg of node.arguments) {
      const argMatch = tsExpressionUsesParam(arg, paramNames);
      if (argMatch) return argMatch;
    }
    return null;
  }
  if (ts.isObjectLiteralExpression(node)) {
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const match = tsExpressionUsesParam(prop.initializer, paramNames);
        if (match) return match;
      }
    }
    return null;
  }
  if (ts.isArrayLiteralExpression(node)) {
    for (const element of node.elements) {
      const match = tsExpressionUsesParam(element, paramNames);
      if (match) return match;
    }
    return null;
  }
  return null;
}

function tsCallArgUsesParam(
  call: ts.CallExpression,
  sinkKind: KnownSinkKind,
  argIndex: number,
  paramNames: Set<string>
): string | null {
  if (sinkKind === "axiosConfig") {
    const arg0 = call.arguments[0];
    if (!arg0 || !ts.isObjectLiteralExpression(arg0)) return null;
    for (const prop of arg0.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = ts.isIdentifier(prop.name) ? prop.name.text : ts.isStringLiteral(prop.name) ? prop.name.text : null;
      if (key !== "url") continue;
      return tsExpressionUsesParam(prop.initializer, paramNames);
    }
    return null;
  }
  const arg = call.arguments[argIndex];
  return tsExpressionUsesParam(arg, paramNames);
}

function classifyTsSinkCall(
  call: ts.CallExpression,
  checker: ts.TypeChecker
): {
  sinkLabel: string;
  severity: "critical" | "error" | "warning";
  kind: KnownSinkKind;
  argIndex: number;
} | null {
  const expression = call.expression;
  const symbol =
    checker.getSymbolAtLocation(expression) ??
    checker.getSymbolAtLocation(expression.getFirstToken() ?? expression);
  const resolvedSymbol =
    symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const importDecl = resolvedSymbol?.declarations?.[0];
  let importSource: string | undefined;
  if (
    importDecl &&
    (ts.isImportSpecifier(importDecl) || ts.isImportClause(importDecl) || ts.isNamespaceImport(importDecl))
  ) {
    const parent = importDecl.parent?.parent;
    if (parent && ts.isImportDeclaration(parent) && ts.isStringLiteral(parent.moduleSpecifier)) {
      importSource = parent.moduleSpecifier.text;
    }
  }
  const details = describeCalleeName(expression.getText());
  return matchKnownSink({
    calleeName: details.calleeName,
    objectName: details.objectName,
    methodName: details.methodName,
    symbolName: resolvedSymbol?.getName(),
    importSource,
  });
}

function resolveWrapperSink(
  node: CallExpression,
  parseResult?: ParseResult | null
): {
  sinkLabel: string;
  severity: "critical" | "error" | "warning";
  kind: KnownSinkKind;
  argIndex: number;
} | null {
  const declaration = getSymbolDeclarationForCall(parseResult, node);
  const checker = parseResult?.typeChecker ?? parseResult?.tsProgram?.getTypeChecker();
  if (!declaration || !declaration.body || !checker) return null;
  const params = declaration.parameters
    .map((param, index) =>
      ts.isIdentifier(param.name) ? { name: param.name.text, index } : null
    )
    .filter((param): param is { name: string; index: number } => !!param);
  if (params.length === 0) return null;
  const paramNames = new Set(params.map((param) => param.name));

  let resolved: {
    sinkLabel: string;
    severity: "critical" | "error" | "warning";
    kind: KnownSinkKind;
    argIndex: number;
  } | null = null;

  const visit = (tsNode: ts.Node): void => {
    if (resolved) return;
    if (ts.isCallExpression(tsNode)) {
      const innerSink = classifyTsSinkCall(tsNode, checker);
      if (innerSink) {
        const paramName = tsCallArgUsesParam(tsNode, innerSink.kind, innerSink.argIndex, paramNames);
        if (paramName) {
          const param = params.find((item) => item.name === paramName);
          if (param) {
            resolved = { ...innerSink, argIndex: param.index };
            return;
          }
        }
      }
    }
    ts.forEachChild(tsNode, visit);
  };

  visit(declaration.body);
  return resolved;
}

// Run taint analysis: find sources, propagate taint, report when tainted data reaches sinks.
export function runTaintEngine(opts: TaintEngineOptions): Finding[] {
  const { source, ast, options, parseResult } = opts;
  const findings: Finding[] = [];

  const sourceNodes = new Map<number, string>();
  const assignments: { node: VariableDeclarator | AssignmentExpression; key: number }[] = [];
  const sinkCalls: {
    node: CallExpression;
    sinkLabel: string;
    severity: "critical" | "error" | "warning";
    kind: KnownSinkKind;
    argIndex: number;
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
      const details = getCallResolution(parseResult, node);
      const directSink = matchKnownSink({
        calleeName: details.calleeName,
        objectName: details.objectName,
        methodName: details.methodName,
        symbolName: details.symbolName,
        importSource: details.importSource,
        isAxiosObjectCall: isAxiosCallExpression(node),
      });
      if (directSink) {
        sinkCalls.push({ node, ...directSink });
        return;
      }
      const wrapperSink = resolveWrapperSink(node, parseResult);
      if (wrapperSink) {
        sinkCalls.push({ node, ...wrapperSink });
      }
    }
  });

  const tainted = new Map<string, string>();

  function exprIsSourceOrTainted(expr: Node): string | null {
    const current = unwrapExpression(expr);
    if (current.type === "MemberExpression") {
      const k = nodeKey(current);
      const label = sourceNodes.get(k);
      if (label) return label;
    }
    if (current.type === "Identifier") {
      const src = tainted.get(current.name);
      if (src) return src;
    }
    if (current.type === "BinaryExpression" && current.operator === "+") {
      const l = exprIsSourceOrTainted(current.left);
      if (l) return l;
      return exprIsSourceOrTainted(current.right) ?? null;
    }
    if (current.type === "TemplateLiteral" && current.expressions.length > 0) {
      for (const e of current.expressions) {
        const t = exprIsSourceOrTainted(e);
        if (t) return t;
      }
    }
    if (current.type === "CallExpression") {
      for (const arg of current.arguments) {
        if (arg.type === "SpreadElement") continue;
        const match = exprIsSourceOrTainted(arg);
        if (match) return match;
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
      const init = node.init;
      if (node.id.type === "Identifier" && init) {
        const id = node.id.name;
        const src = exprIsSourceOrTainted(init);
        if (src) addTainted(id, src);
      } else if (node.id.type === "ObjectPattern" && init) {
        const src = exprIsSourceOrTainted(init);
        if (src) addDestructuredTaint(node.id, src, addTainted);
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

  for (const { node, sinkLabel, severity, kind, argIndex } of sinkCalls) {
    const findingSeverity =
      severity === "critical" ? 3 : severity === "error" ? 2 : 1;
    if (findingSeverity < severityThreshold) continue;

    let targetArg: Expression | null | undefined =
      kind === "axiosConfig" ? getAxiosUrlExpression(node) : callArg(node, argIndex);
    if (kind === "axiosConfig" && !targetArg) continue;
    if (targetArg === undefined || targetArg === null) continue;

    if (kind === "sql") {
      const firstArg = callArg(node, 0);
      const queryLiteral =
        firstArg && firstArg.type === "Literal" && typeof firstArg.value === "string"
          ? firstArg.value
          : "";
      const hasSecondArg = node.arguments.length > 1;
      if (looksParameterized(queryLiteral, hasSecondArg)) continue;
    }

    const sourceLabel = exprIsSourceOrTainted(targetArg as Node);
    if (!sourceLabel) continue;

    if (kind === "proto") {
      const isReqBodyOrQuery =
        sourceLabel.includes("req.body") ||
        sourceLabel.includes("req.query") ||
        sourceLabel.includes("request.body") ||
        sourceLabel.includes("request.query");
      if (!isReqBodyOrQuery) continue;
    }

    const loc = node.loc;
    if (!loc) continue;

    let ruleId: string;
    let message: string;
    let why: string;
    let fix: string;
    let cwe: number | undefined;
    let owasp: string | undefined;

    if (kind === "ssrf" || kind === "axiosConfig") {
      ruleId = "injection.ssrf.tainted-flow";
      message = "SSRF risk: untrusted data reaches outbound request URL.";
      why = "Attackers can make the server request internal or cloud metadata endpoints.";
      fix = "Use an allowlist of hosts/schemes; block private IPs and link-local addresses.";
      cwe = 918;
      owasp = "A10:2021";
    } else if (kind === "proto") {
      ruleId = "injection.prototype-pollution.tainted-flow";
      message = "Prototype pollution risk: user input in deep merge or path set.";
      why = "Attacker-controlled objects can pollute Object.prototype.";
      fix = "Avoid merging user input into objects with deep merge; validate keys; use Object.create(null).";
      cwe = 1321;
      owasp = "A03:2021";
    } else {
      ruleId =
        kind === "command"
          ? "injection.command.tainted-flow"
          : kind === "sql"
            ? "injection.sql.tainted-flow"
            : kind === "xpath"
              ? "injection.xpath.tainted-flow"
              : kind === "log"
                ? "injection.log.tainted-flow"
                : "injection.path-traversal.tainted-flow";
      message =
        ruleId === "injection.sql.tainted-flow"
          ? "SQL Injection risk"
          : ruleId === "injection.command.tainted-flow"
            ? "Command injection risk"
            : ruleId === "injection.xpath.tainted-flow"
              ? "XPath injection risk"
              : ruleId === "injection.log.tainted-flow"
                ? "Log injection risk"
                : "Path traversal risk";
      why =
        ruleId === "injection.sql.tainted-flow"
          ? "Untrusted input flows into a SQL query via string concatenation."
          : ruleId === "injection.log.tainted-flow"
            ? "Unsanitized input in logs can allow fake entries or impersonation via CR/LF."
            : "Untrusted input flows into a dangerous sink.";
      fix =
        ruleId === "injection.sql.tainted-flow"
          ? 'Use parameterized queries: db.query("SELECT * FROM users WHERE id=?", [id])'
          : ruleId === "injection.log.tainted-flow"
            ? "Sanitize log input: strip CR/LF; limit message size."
            : "Sanitize or allowlist user input before passing to this API.";
    }

    const sev: Severity =
      severity === "critical" ? "critical" : severity === "warning" ? "warning" : "error";

    const evidenceSignals: Finding["evidenceSignals"] | undefined =
      ruleId === "injection.sql.tainted-flow"
        ? { sanitization: "none" }
        : { sanitization: "unknown" };

    const finding: Finding = {
      ruleId,
      message,
      why,
      fix,
      severity: sev,
      severityLabel: SEVERITY_LABEL[sev],
      category: "injection",
      cwe,
      owasp,
      findingKind: kind === "proto" ? "PROTOTYPE_POLLUTION" : undefined,
      sourceLabel,
      sinkLabel,
      line: loc.start.line,
      column: loc.start.column,
      endLine: loc.end?.line,
      endColumn: loc.end?.column,
      filePath: opts.filePath,
      source: source.split("\n")[loc.start.line - 1],
      evidenceSignals,
    };
    findings.push(finding);
  }

  return findings;
}
