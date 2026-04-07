import { dirname, resolve } from "node:path";
import ts from "typescript";
import type { ScanWarning, ScannerOptions, TsAnalysisMode } from "../types.js";

export interface SourceEntry {
  path: string;
  source: string;
}

export interface TsProjectContext {
  mode: TsAnalysisMode;
  enabled: boolean;
  projectRoot: string;
  tsconfigPath?: string;
  program?: ts.Program;
  typeChecker?: ts.TypeChecker;
  diagnostics: ts.Diagnostic[];
  warnings: ScanWarning[];
}

function normalizePath(filePath: string): string {
  return resolve(filePath);
}

export function isTypeScriptFile(filePath: string): boolean {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  return (
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".mts") ||
    lower.endsWith(".cts")
  );
}

function scriptKindFor(filePath: string): ts.ScriptKind {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  if (lower.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (lower.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (lower.endsWith(".ts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function tsFallbackWarning(message: string): ScanWarning {
  return {
    code: "ts.semantic.fallback",
    message,
  };
}

function tsConfigWarning(message: string): ScanWarning {
  return {
    code: "ts.semantic.project",
    message,
  };
}

function throwOrWarn(
  mode: TsAnalysisMode,
  failOpen: boolean,
  message: string
): { warnings: ScanWarning[] } {
  if (mode === "semantic" && !failOpen) {
    throw new Error(message);
  }
  return { warnings: [mode === "semantic" ? tsConfigWarning(message) : tsFallbackWarning(message)] };
}

export function createTsProjectContext(
  files: SourceEntry[],
  options: ScannerOptions = {}
): TsProjectContext | null {
  const mode = options.tsAnalysis ?? "off";
  if (mode === "off") return null;

  const tsFiles = files.filter((file) => isTypeScriptFile(file.path));
  if (tsFiles.length === 0) {
    return {
      mode,
      enabled: false,
      projectRoot: resolve(options.projectRoot ?? process.cwd()),
      diagnostics: [],
      warnings: [],
    };
  }

  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const failOpen = options.tsFailOpen ?? mode !== "semantic";
  const explicitConfig = options.tsconfigPath ? resolve(projectRoot, options.tsconfigPath) : undefined;
  const tsconfigPath =
    explicitConfig ??
    ts.findConfigFile(projectRoot, ts.sys.fileExists, "tsconfig.json") ??
    undefined;

  if (!tsconfigPath) {
    const failure = throwOrWarn(
      mode,
      failOpen,
      `TypeScript semantic analysis requested, but no tsconfig.json was found under ${projectRoot}.`
    );
    return {
      mode,
      enabled: false,
      projectRoot,
      diagnostics: [],
      warnings: failure.warnings,
    };
  }

  const configResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configResult.error) {
    const message = ts.formatDiagnosticsWithColorAndContext([configResult.error], {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => "\n",
    });
    const failure = throwOrWarn(
      mode,
      failOpen,
      `Failed to read TypeScript config at ${tsconfigPath}.\n${message.trim()}`
    );
    return {
      mode,
      enabled: false,
      projectRoot,
      tsconfigPath,
      diagnostics: [configResult.error],
      warnings: failure.warnings,
    };
  }

  const parsed = ts.parseJsonConfigFileContent(
    configResult.config,
    ts.sys,
    dirname(tsconfigPath),
    undefined,
    tsconfigPath
  );

  if (parsed.errors.length > 0) {
    const message = ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => "\n",
    });
    const failure = throwOrWarn(
      mode,
      failOpen,
      `Failed to parse TypeScript config at ${tsconfigPath}.\n${message.trim()}`
    );
    return {
      mode,
      enabled: false,
      projectRoot,
      tsconfigPath,
      diagnostics: parsed.errors,
      warnings: failure.warnings,
    };
  }

  const sourceOverrides = new Map<string, string>();
  for (const file of files) {
    sourceOverrides.set(normalizePath(file.path), file.source);
  }

  const rootNames = [...new Set([...parsed.fileNames.map(normalizePath), ...tsFiles.map((f) => normalizePath(f.path))])];
  const host = ts.createCompilerHost(parsed.options, true);
  const originalReadFile = host.readFile.bind(host);
  const originalFileExists = host.fileExists.bind(host);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.readFile = (fileName) => {
    const override = sourceOverrides.get(normalizePath(fileName));
    if (override !== undefined) return override;
    return originalReadFile(fileName);
  };

  host.fileExists = (fileName) => {
    if (sourceOverrides.has(normalizePath(fileName))) return true;
    return originalFileExists(fileName);
  };

  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const override = sourceOverrides.get(normalizePath(fileName));
    if (override !== undefined) {
      return ts.createSourceFile(
        fileName,
        override,
        languageVersion,
        true,
        scriptKindFor(fileName)
      );
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const program = ts.createProgram({
    rootNames,
    options: parsed.options,
    projectReferences: parsed.projectReferences,
    host,
  });
  const diagnostics = ts.getConfigFileParsingDiagnostics(parsed).concat(
    program.getSyntacticDiagnostics(),
    program.getOptionsDiagnostics()
  );
  const warnings =
    diagnostics.length > 0
      ? [
          {
            code: "ts.semantic.diagnostics",
            message: `TypeScript project ${tsconfigPath} reported ${diagnostics.length} diagnostic(s); semantic analysis continues with available type information.`,
          },
        ]
      : [];

  return {
    mode,
    enabled: true,
    projectRoot,
    tsconfigPath,
    program,
    typeChecker: program.getTypeChecker(),
    diagnostics,
    warnings,
  };
}
