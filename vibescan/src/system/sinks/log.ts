// Log sinks: first argument is the log message. Tainted input without sanitization is log injection.
export const LOG_SINK_METHODS = new Set([
  "log",
  "info",
  "warn",
  "error",
  "debug",
  "trace",
  "write",
  "child",
]);

// console, logger, winston, pino, bunyan, log
export const LOG_OBJECTS = new Set([
  "console",
  "logger",
  "log",
  "winston",
  "pino",
  "bunyan",
]);
export const LOG_IMPORT_SOURCES = new Set([
  "winston",
  "pino",
  "bunyan",
]);

export function getLogSinkCallee(
  objName: string,
  methodName: string
): string | null {
  if (!LOG_SINK_METHODS.has(methodName)) return null;
  const objLower = objName.toLowerCase();
  if (LOG_OBJECTS.has(objLower)) return `${objName}.${methodName}`;
  return null;
}

export function getImportedLogSinkCallee(
  importSource: string | undefined,
  methodName: string
): string | null {
  if (!importSource || !LOG_SINK_METHODS.has(methodName)) return null;
  if (LOG_IMPORT_SOURCES.has(importSource)) return `${importSource}.${methodName}`;
  return null;
}
