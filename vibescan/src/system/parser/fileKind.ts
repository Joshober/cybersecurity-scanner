import ts from "typescript";

export type FileKind = "js" | "jsx" | "ts" | "tsx" | "mts" | "cts" | "ejs" | "unknown";

const EXTENSION_MAP: Record<string, FileKind> = {
  ".js": "js",
  ".mjs": "js",
  ".cjs": "js",
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
  ".mts": "mts",
  ".cts": "cts",
  ".ejs": "ejs",
};

export function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function classifyFile(filePath: string): FileKind {
  const lower = normalizeFilePath(filePath).toLowerCase();
  for (const [ext, kind] of Object.entries(EXTENSION_MAP)) {
    if (lower.endsWith(ext)) return kind;
  }
  return "unknown";
}

export function isTypeScript(kind: FileKind): boolean {
  return kind === "ts" || kind === "tsx" || kind === "mts" || kind === "cts";
}

export function isTypeScriptFile(filePath: string): boolean {
  return isTypeScript(classifyFile(filePath));
}

export function isJsx(kind: FileKind): boolean {
  return kind === "jsx" || kind === "tsx";
}

export function isEjs(kind: FileKind): boolean {
  return kind === "ejs";
}

export function scriptKindFor(kind: FileKind): ts.ScriptKind {
  switch (kind) {
    case "tsx":
      return ts.ScriptKind.TSX;
    case "jsx":
      return ts.ScriptKind.JSX;
    case "ts":
    case "mts":
    case "cts":
      return ts.ScriptKind.TS;
    default:
      return ts.ScriptKind.JS;
  }
}
