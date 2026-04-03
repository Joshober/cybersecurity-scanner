// Parse JavaScript/TypeScript/JSX source into an ESTree AST for the pattern rule engine and taint engine.

import * as acorn from "acorn";
import jsx from "acorn-jsx";
import type { Program } from "estree";

export interface ParseResult {
  ast: Program;
  source: string;
}

const jsxParser = acorn.Parser.extend(jsx());

function useJsxParser(filePath: string): boolean {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  return lower.endsWith(".tsx") || lower.endsWith(".jsx");
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

// Parse source into an AST. Uses Acorn + acorn-jsx for .tsx/.jsx (JSX, including "TSX" files that are valid JS).
// Other extensions use Acorn without JSX.
export function parseFile(source: string, filePath = ""): ParseResult | null {
  if (useJsxParser(filePath)) {
    const ast = parseJsxSource(source);
    if (ast) return { ast, source };
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
      return { ast, source };
    } catch {
      continue;
    }
  }
  return null;
}
