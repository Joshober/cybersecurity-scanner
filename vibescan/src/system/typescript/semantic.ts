import type { CallExpression, Node } from "estree";
import ts from "typescript";
import type { ParseResult } from "../parser/parseFile.js";

export interface ResolvedCall {
  calleeName: string | null;
  importSource?: string;
  symbolName?: string;
}

function resolveAliasedSymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol | undefined
): ts.Symbol | undefined {
  if (!symbol) return undefined;
  if (symbol.flags & ts.SymbolFlags.Alias) {
    try {
      return checker.getAliasedSymbol(symbol);
    } catch {
      return symbol;
    }
  }
  return symbol;
}

function importSourceFromDeclaration(declaration: ts.Declaration | undefined): string | undefined {
  if (!declaration) return undefined;
  if (ts.isImportSpecifier(declaration) || ts.isImportClause(declaration) || ts.isNamespaceImport(declaration)) {
    let current: ts.Node | undefined = declaration;
    while (current && !ts.isImportDeclaration(current)) current = current.parent;
    if (current && ts.isImportDeclaration(current) && ts.isStringLiteral(current.moduleSpecifier)) {
      return current.moduleSpecifier.text;
    }
  }
  return undefined;
}

function importedSymbolNameFromDeclaration(declaration: ts.Declaration | undefined): string | undefined {
  if (!declaration) return undefined;
  if (ts.isImportSpecifier(declaration)) {
    return declaration.propertyName?.text ?? declaration.name.text;
  }
  if (ts.isImportClause(declaration)) {
    return declaration.name?.text ?? "default";
  }
  if (ts.isNamespaceImport(declaration)) {
    return "*";
  }
  return undefined;
}

export function getTypeChecker(parseResult?: ParseResult | null): ts.TypeChecker | undefined {
  return parseResult?.typeChecker ?? parseResult?.tsProgram?.getTypeChecker();
}

export function getTsNode(
  parseResult: ParseResult | null | undefined,
  estreeNode: Node
): ts.Node | undefined {
  const map = parseResult?.parserServices?.esTreeNodeToTSNodeMap;
  if (!map) return undefined;
  return map.get(estreeNode as unknown as object);
}

export function getResolvedCall(
  parseResult: ParseResult | null | undefined,
  node: CallExpression
): ResolvedCall | null {
  const checker = getTypeChecker(parseResult);
  const tsNode = getTsNode(parseResult, node);
  if (!checker || !tsNode || !ts.isCallExpression(tsNode)) return null;

  const expression = tsNode.expression;
  const localSymbol =
    checker.getSymbolAtLocation(expression) ??
    checker.getSymbolAtLocation(expression.getFirstToken() ?? expression);
  const resolvedSymbol =
    resolveAliasedSymbol(checker, localSymbol) ??
    resolveAliasedSymbol(checker, checker.getSymbolAtLocation(expression.getFirstToken() ?? expression));
  const localDeclaration = localSymbol?.declarations?.[0];
  const importSource =
    importSourceFromDeclaration(localDeclaration) ??
    importSourceFromDeclaration(resolvedSymbol?.declarations?.[0]);
  const symbolName =
    importedSymbolNameFromDeclaration(localDeclaration) ??
    resolvedSymbol?.getName() ??
    localSymbol?.getName();

  if (ts.isIdentifier(expression)) {
    return {
      calleeName: expression.text,
      importSource,
      symbolName,
    };
  }

  if (ts.isPropertyAccessExpression(expression)) {
    const parts: string[] = [];
    let cur: ts.Expression = expression;
    while (ts.isPropertyAccessExpression(cur)) {
      parts.unshift(cur.name.text);
      cur = cur.expression;
    }
    if (ts.isIdentifier(cur)) parts.unshift(cur.text);
    return {
      calleeName: parts.length > 0 ? parts.join(".") : null,
      importSource,
      symbolName,
    };
  }

  return {
    calleeName: symbolName ?? null,
    importSource,
    symbolName,
  };
}

export function getSymbolDeclarationForCall(
  parseResult: ParseResult | null | undefined,
  node: CallExpression
): (ts.SignatureDeclaration & { body?: ts.ConciseBody }) | undefined {
  const checker = getTypeChecker(parseResult);
  const tsNode = getTsNode(parseResult, node);
  if (!checker || !tsNode || !ts.isCallExpression(tsNode)) return undefined;
  const signature = checker.getResolvedSignature(tsNode);
  const declaration = signature?.getDeclaration();
  if (!declaration) return undefined;
  return ts.isFunctionLike(declaration)
    ? (declaration as ts.SignatureDeclaration & { body?: ts.ConciseBody })
    : undefined;
}

function symbolForNode(
  checker: ts.TypeChecker,
  tsNode: ts.Node | undefined
): ts.Symbol | undefined {
  if (!tsNode) return undefined;
  return resolveAliasedSymbol(checker, checker.getSymbolAtLocation(tsNode));
}

export function getImportSourceForNode(
  parseResult: ParseResult | null | undefined,
  node: Node
): string | undefined {
  const checker = getTypeChecker(parseResult);
  const tsNode = getTsNode(parseResult, node);
  if (!checker || !tsNode) return undefined;
  return importSourceFromDeclaration(symbolForNode(checker, tsNode)?.declarations?.[0]);
}

export function getTypeText(
  parseResult: ParseResult | null | undefined,
  node: Node
): string | undefined {
  const checker = getTypeChecker(parseResult);
  const tsNode = getTsNode(parseResult, node);
  if (!checker || !tsNode) return undefined;
  try {
    return checker.typeToString(checker.getTypeAtLocation(tsNode));
  } catch {
    return undefined;
  }
}

export function isStringLikeType(
  parseResult: ParseResult | null | undefined,
  node: Node
): boolean {
  const checker = getTypeChecker(parseResult);
  const tsNode = getTsNode(parseResult, node);
  if (!checker || !tsNode) return false;
  try {
    const type = checker.getTypeAtLocation(tsNode);
    return (type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLike)) !== 0;
  } catch {
    return false;
  }
}
