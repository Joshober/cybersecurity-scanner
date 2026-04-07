import { getCommandSinkCallee, getImportedCommandSinkCallee } from "./command.js";
import { getLogSinkCallee, getImportedLogSinkCallee } from "./log.js";
import { getPathSinkCallee, getImportedPathSinkCallee } from "./path.js";
import {
  getImportedLodashSetSink,
  getImportedPrototypeMergeSink,
  getLodashSetSink,
  getPrototypeMergeSink,
  isDeepmergeCallee,
} from "./prototype.js";
import { getSqlSinkCallee } from "./sql.js";
import { getImportedSsrSinkInfo, getSsrSinkInfo } from "./ssrf.js";
import { getXpathSinkCallee } from "./xpath.js";

export * from "./sql.js";
export * from "./command.js";
export * from "./path.js";
export * from "./xpath.js";
export * from "./log.js";
export * from "./ssrf.js";
export * from "./prototype.js";
export * from "./jwtCookie.js";

export type KnownSinkKind =
  | "sql"
  | "command"
  | "path"
  | "xpath"
  | "log"
  | "ssrf"
  | "axiosConfig"
  | "proto";

export interface KnownSinkMatch {
  sinkLabel: string;
  severity: "critical" | "error" | "warning";
  kind: KnownSinkKind;
  argIndex: number;
}

export interface KnownSinkCandidate {
  calleeName: string | null;
  objectName?: string | null;
  methodName?: string | null;
  symbolName?: string;
  importSource?: string;
  isAxiosObjectCall?: boolean;
}

export function matchKnownSink(candidate: KnownSinkCandidate): KnownSinkMatch | null {
  const calleeName =
    candidate.importSource && candidate.symbolName && !candidate.objectName
      ? candidate.symbolName
      : candidate.calleeName;
  const objectName = candidate.objectName ?? "";
  const methodName =
    candidate.importSource && candidate.symbolName && !candidate.objectName
      ? candidate.symbolName
      : candidate.methodName ?? "";
  const importSource = candidate.importSource;

  if (calleeName === "fetch") {
    return { sinkLabel: "fetch", severity: "error", kind: "ssrf", argIndex: 0 };
  }
  if (candidate.isAxiosObjectCall || importSource === "axios" || calleeName === "axios") {
    return { sinkLabel: "axios(config)", severity: "error", kind: "axiosConfig", argIndex: 0 };
  }
  if (calleeName && isDeepmergeCallee(calleeName)) {
    return { sinkLabel: calleeName, severity: "error", kind: "proto", argIndex: 1 };
  }
  if (!methodName) return null;

  const sqlSink = getSqlSinkCallee(objectName, methodName);
  if (sqlSink) return { sinkLabel: sqlSink, severity: "error", kind: "sql", argIndex: 0 };

  const commandSink =
    getCommandSinkCallee(objectName, methodName) ??
    getImportedCommandSinkCallee(importSource, methodName);
  if (commandSink) {
    return { sinkLabel: commandSink, severity: "critical", kind: "command", argIndex: 0 };
  }

  const pathSink =
    getPathSinkCallee(objectName, methodName) ??
    getImportedPathSinkCallee(importSource, methodName);
  if (pathSink) {
    return { sinkLabel: pathSink, severity: "error", kind: "path", argIndex: 0 };
  }

  const xpathSink = getXpathSinkCallee(objectName, methodName);
  if (xpathSink) return { sinkLabel: xpathSink, severity: "error", kind: "xpath", argIndex: 0 };

  const logSink =
    getLogSinkCallee(objectName, methodName) ??
    getImportedLogSinkCallee(importSource, methodName);
  if (logSink) {
    return { sinkLabel: logSink, severity: "warning", kind: "log", argIndex: 0 };
  }

  const ssrfSink =
    (calleeName ? getSsrSinkInfo(calleeName, objectName, methodName) : null) ??
    getImportedSsrSinkInfo(importSource, methodName);
  if (ssrfSink) {
    return {
      sinkLabel: ssrfSink.label,
      severity: "error",
      kind: "ssrf",
      argIndex: ssrfSink.argIndex,
    };
  }

  const mergeSink =
    getPrototypeMergeSink(objectName, methodName) ??
    getImportedPrototypeMergeSink(importSource, methodName);
  if (mergeSink) {
    return {
      sinkLabel: mergeSink.label,
      severity: "error",
      kind: "proto",
      argIndex: mergeSink.taintedArgIndex,
    };
  }

  const setSink =
    getLodashSetSink(objectName, methodName) ??
    getImportedLodashSetSink(importSource, methodName);
  if (setSink) {
    return {
      sinkLabel: setSink.label,
      severity: "error",
      kind: "proto",
      argIndex: setSink.taintedArgIndex,
    };
  }

  return null;
}
