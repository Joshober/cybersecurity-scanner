// Parse JavaScript/TypeScript/JSX source into an ESTree AST for the pattern rule engine and taint engine.

import * as acorn from "acorn";
import jsx from "acorn-jsx";
import * as tsParser from "@typescript-eslint/parser";
import type { Program } from "estree";
import type ts from "typescript";
import type { TsProjectContext } from "./tsProject.js";
import { isTypeScriptFile } from "./tsProject.js";

export type ParserKind = "acorn" | "typescript-eslint";

export interface ParserServicesLike {
  program?: ts.Program;
  esTreeNodeToTSNodeMap?: WeakMap<object, ts.Node>;
  tsNodeToESTreeNodeMap?: WeakMap<object, unknown>;
}

export interface ParseResult {
  ast: Program;
  source: string;
  parserKind: ParserKind;
  sourceFile?: ts.SourceFile;
  tsProgram?: ts.Program;
  typeChecker?: ts.TypeChecker;
  parserServices?: ParserServicesLike;
  diagnostics?: string[];
}

export interface ParseFileOptions {
  tsProject?: TsProjectContext | null;
}

const jsxParser = acorn.Parser.extend(jsx());

function useJsxParser(filePath: string): boolean {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  return lower.endsWith(".jsx");
}

function useTsxParser(filePath: string): boolean {
  return filePath.replace(/\\/g, "/").toLowerCase().endsWith(".tsx");
}

function parseJsxSource(source: string): Program | null {
  for (const sourceType of ["module", "script"] as const) {
    try {
      const ast = jsxParser.parse(source, {
        ecmaVersion: "latest",
        locations: true,
        sourceType,
        allowHashBang: true,
      }) as unknown as Program;
      return ast;
    } catch {
      continue;
    }
  }
  return null;
}

function parseJavaScript(source: string, filePath: string): ParseResult | null {
  if (useJsxParser(filePath)) {
    const ast = parseJsxSource(source);
    if (ast) return { ast, source, parserKind: "acorn" };
    return null;
  }

  for (const sourceType of ["module", "script"] as const) {
    try {
      const ast = acorn.parse(source, {
        ecmaVersion: "latest",
        locations: true,
        sourceType,
        allowHashBang: true,
      }) as unknown as Program;
      return { ast, source, parserKind: "acorn" };
    } catch {
      continue;
    }
  }
  return null;
}

function parseTypeScript(
  source: string,
  filePath: string,
  tsProject?: TsProjectContext | null
): ParseResult | null {
  const parserOptions: Record<string, unknown> = {
    filePath,
    sourceType: "module",
    ecmaVersion: "latest",
    loc: true,
    range: true,
    comment: false,
    tokens: false,
    ecmaFeatures: { jsx: useTsxParser(filePath) },
  };

  if (tsProject?.enabled && tsProject.program) {
    parserOptions.programs = [tsProject.program];
  }

  try {
    const parsed = tsParser.parseForESLint(source, parserOptions as never) as unknown as {
      ast: Program;
      services?: ParserServicesLike;
    };
    const parserServices = parsed.services;
    const program = parserServices?.program ?? tsProject?.program;
    const normalizedPath = filePath.replace(/\\/g, "/");
    const sourceFile = program
      ?.getSourceFiles()
      .find((file) => file.fileName.replace(/\\/g, "/") === normalizedPath);
    return {
      ast: parsed.ast,
      source,
      parserKind: "typescript-eslint",
      sourceFile,
      tsProgram: program,
      typeChecker: tsProject?.typeChecker ?? program?.getTypeChecker(),
      parserServices,
    };
  } catch {
    return null;
  }
}

// Parse source into an AST. Uses Acorn for JS/JSX and @typescript-eslint/parser for TS/TSX.
export function parseFile(
  source: string,
  filePath = "",
  options: ParseFileOptions = {}
): ParseResult | null {
  if (isTypeScriptFile(filePath)) {
    return parseTypeScript(source, filePath, options.tsProject);
  }
  return parseJavaScript(source, filePath);
}
