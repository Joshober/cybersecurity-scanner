// Parse JavaScript/TypeScript/JSX/EJS source into an ESTree AST for the pattern rule engine and taint engine.

import * as acorn from "acorn";
import jsx from "acorn-jsx";
import * as tsParser from "@typescript-eslint/parser";
import type { Program } from "estree";
import type ts from "typescript";
import type { TsProjectContext } from "./tsProject.js";
import { classifyFile, isTypeScript, isJsx, isEjs, normalizeFilePath, type FileKind } from "./fileKind.js";
import { extractEjsScriptBlocks } from "./ejsScripts.js";

export type ParserKind = "acorn" | "typescript-eslint";

export interface ParserServicesLike {
  program?: ts.Program;
  esTreeNodeToTSNodeMap?: WeakMap<object, ts.Node>;
  tsNodeToESTreeNodeMap?: WeakMap<object, unknown>;
}

export interface ParseResult {
  ast: Program;
  source: string;
  fileKind: FileKind;
  parserKind: ParserKind;
  sourceFile?: ts.SourceFile;
  tsProgram?: ts.Program;
  typeChecker?: ts.TypeChecker;
  parserServices?: ParserServicesLike;
  diagnostics?: string[];
  ejsBlocks?: EjsParsedBlock[];
}

export interface EjsParsedBlock {
  parseResult: ParseResult;
  lineDelta: number;
}

export interface ParseFileOptions {
  tsProject?: TsProjectContext | null;
}

const jsxParser = acorn.Parser.extend(jsx());

// ─── Internal parsers ───────────────────────────────────────────────

function parseJsxSource(source: string): Program | null {
  for (const sourceType of ["module", "script"] as const) {
    try {
      return jsxParser.parse(source, {
        ecmaVersion: "latest",
        locations: true,
        sourceType,
        allowHashBang: true,
      }) as unknown as Program;
    } catch {
      continue;
    }
  }
  return null;
}

function parseJavaScript(source: string, kind: FileKind): ParseResult | null {
  for (const sourceType of ["module", "script"] as const) {
    try {
      const ast = acorn.parse(source, {
        ecmaVersion: "latest",
        locations: true,
        sourceType,
        allowHashBang: true,
      }) as unknown as Program;
      return { ast, source, fileKind: kind, parserKind: "acorn" };
    } catch {
      continue;
    }
  }
  return null;
}

function parseTypeScriptSource(
  source: string,
  filePath: string,
  kind: FileKind,
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
    ecmaFeatures: { jsx: isJsx(kind) },
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
    const normalizedPath = normalizeFilePath(filePath);
    const sourceFile = program
      ?.getSourceFiles()
      .find((file) => normalizeFilePath(file.fileName) === normalizedPath);
    return {
      ast: parsed.ast,
      source,
      fileKind: kind,
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

function parseEjsSource(
  source: string,
  filePath: string,
  tsProject?: TsProjectContext | null
): ParseResult | null {
  const blocks = extractEjsScriptBlocks(source);
  if (blocks.length === 0) return null;

  const ejsBlocks: EjsParsedBlock[] = [];
  for (const block of blocks) {
    if (!block.content.trim()) continue;
    const pr = parseFileInternal(block.content, filePath, tsProject);
    if (!pr) continue;
    ejsBlocks.push({ parseResult: pr, lineDelta: block.baseLine - 1 });
  }
  if (ejsBlocks.length === 0) return null;

  const syntheticAst: Program = { type: "Program", body: [], sourceType: "script" } as Program;
  return {
    ast: syntheticAst,
    source,
    fileKind: "ejs",
    parserKind: "acorn",
    ejsBlocks,
  };
}

function parseFileInternal(
  source: string,
  filePath: string,
  tsProject?: TsProjectContext | null
): ParseResult | null {
  const kind = classifyFile(filePath);

  if (isTypeScript(kind)) {
    return parseTypeScriptSource(source, filePath, kind, tsProject);
  }
  if (kind === "jsx") {
    const ast = parseJsxSource(source);
    return ast ? { ast, source, fileKind: kind, parserKind: "acorn" } : null;
  }
  return parseJavaScript(source, kind);
}

// ─── Public API ─────────────────────────────────────────────────────

export function parseFile(
  source: string,
  filePath = "",
  options: ParseFileOptions = {}
): ParseResult | null {
  const kind = classifyFile(filePath);

  if (isEjs(kind)) {
    return parseEjsSource(source, filePath, options.tsProject);
  }

  return parseFileInternal(source, filePath, options.tsProject);
}
