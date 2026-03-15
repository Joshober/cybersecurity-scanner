// Parse JavaScript/TypeScript source into an ESTree AST for the pattern rule engine and taint engine.

import * as acorn from "acorn";
import type { Program } from "estree";

export interface ParseResult {
  ast: Program;
  source: string;
}

// Parse source into an AST. Tries module first, then script.
export function parseFile(source: string): ParseResult | null {
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
