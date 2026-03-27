// Baseline digest: allow teams to freeze known findings and fail only on regressions.

import { relative, resolve } from "node:path";
import type { Finding } from "./types.js";

export const BASELINE_FILE_VERSION = 1 as const;

export interface BaselineEntry {
  ruleId: string;
  /** Project-relative POSIX path when possible. */
  file: string;
  line: number;
}

export interface BaselineFile {
  version: typeof BASELINE_FILE_VERSION;
  generatedAt: string;
  tool: "vibescan";
  /** Optional note for auditors. */
  note?: string;
  entries: BaselineEntry[];
}

function normalizePathForBaseline(projectRoot: string, filePath: string): string {
  const abs = resolve(filePath);
  const rel = relative(resolve(projectRoot), abs).split("\\").join("/");
  if (!rel || rel.startsWith("..")) return abs.split("\\").join("/");
  return rel;
}

/** Build baseline entries from current findings (after suppressions). */
export function findingsToBaselineEntries(projectRoot: string, findings: Finding[]): BaselineEntry[] {
  const out: BaselineEntry[] = [];
  for (const f of findings) {
    if (!f.filePath) continue;
    out.push({
      ruleId: f.ruleId,
      file: normalizePathForBaseline(projectRoot, f.filePath),
      line: f.line,
    });
  }
  out.sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    return a.ruleId.localeCompare(b.ruleId);
  });
  return out;
}

function pathMatchesBaselineEntry(entryFile: string, findingFile: string): boolean {
  const e = entryFile.replace(/\\/g, "/");
  const f = findingFile.replace(/\\/g, "/");
  if (e === f) return true;
  if (f.endsWith("/" + e) || f.endsWith(e)) return true;
  if (e.endsWith("/" + f) || e.endsWith(f)) return true;
  return false;
}

/** True if this finding is in the baseline (ignored for fail gate / optionally for display). */
export function findingInBaseline(f: Finding, entries: BaselineEntry[]): boolean {
  if (!f.filePath) return false;
  const fp = f.filePath.replace(/\\/g, "/");
  return entries.some(
    (e) => e.ruleId === f.ruleId && e.line === f.line && pathMatchesBaselineEntry(e.file, fp)
  );
}

/** Split findings into baseline (known) and fresh (new since baseline). */
export function partitionByBaseline(
  findings: Finding[],
  entries: BaselineEntry[]
): { baseline: Finding[]; fresh: Finding[] } {
  const baseline: Finding[] = [];
  const fresh: Finding[] = [];
  for (const f of findings) {
    (findingInBaseline(f, entries) ? baseline : fresh).push(f);
  }
  return { baseline, fresh };
}

export function parseBaselineFile(raw: string): BaselineFile {
  const data = JSON.parse(raw) as Partial<BaselineFile>;
  if (data.version !== BASELINE_FILE_VERSION || !Array.isArray(data.entries)) {
    throw new Error("Invalid baseline file: expected version 1 and entries[]");
  }
  return data as BaselineFile;
}
