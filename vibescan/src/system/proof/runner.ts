/**
 * Run generated `.test.mjs` proofs (node --test) and record structured results for CI.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { computeFindingId } from "../evidence.js";
import type { Finding } from "../types.js";

export type ProofRunResult = "pass" | "fail" | "inconclusive";

export interface ProofRunEntry {
  findingId: string;
  ruleId: string;
  generatedPath: string;
  proofGenerated: boolean;
  proofExecuted: boolean;
  result: ProofRunResult;
  durationMs: number;
  exitCode: number | null;
  stderrTail?: string;
  /** Heuristic: non-zero exit with empty tests or spawn error. */
  envNotes?: string[];
}

export interface ProofRunLog {
  version: 1;
  generatedAt: string;
  fromJson?: string;
  entries: ProofRunEntry[];
  summary: {
    total: number;
    executed: number;
    pass: number;
    fail: number;
    inconclusive: number;
    totalDurationMs: number;
  };
}

function loadFindingsFromProjectJson(text: string): Finding[] {
  const j = JSON.parse(text) as Record<string, unknown>;
  if (Array.isArray(j.findings)) {
    return j.findings as Finding[];
  }
  return [];
}

function syntheticFindingFromRow(o: Record<string, unknown>): Finding {
  return {
    ruleId: String(o.ruleId ?? ""),
    message: String(o.message ?? ""),
    line: Number(o.line ?? 0),
    column: typeof o.column === "number" ? o.column : 0,
    filePath:
      typeof o.filePath === "string"
        ? o.filePath
        : typeof o.file === "string"
          ? o.file
          : undefined,
    severity: "info",
    severityLabel: "LOW",
    category: "injection",
    proofGeneration: o.proofGeneration as Finding["proofGeneration"],
  };
}

function rowsFromJson(text: string): Record<string, unknown>[] {
  const j = JSON.parse(text) as Record<string, unknown>;
  if (Array.isArray(j.findings)) return j.findings as Record<string, unknown>[];
  const results = j.results;
  if (Array.isArray(results)) {
    const out: Record<string, unknown>[] = [];
    for (const r of results) {
      if (r && typeof r === "object" && Array.isArray((r as { findings?: unknown }).findings)) {
        out.push(...((r as { findings: Record<string, unknown>[] }).findings ?? []));
      }
    }
    return out;
  }
  return [];
}

/** Resolve path from JSON: absolute or relative to JSON file directory. */
function resolveProofPath(jsonPath: string, rawPath: string): string {
  if (isAbsolute(rawPath)) return rawPath;
  return resolve(dirname(jsonPath), rawPath);
}

function runOneTestFile(testPath: string): {
  exitCode: number | null;
  durationMs: number;
  stderr: string;
  error?: string;
} {
  const start = Date.now();
  const r = spawnSync(process.execPath, ["--test", testPath], {
    encoding: "utf-8",
    maxBuffer: 2 * 1024 * 1024,
  });
  const durationMs = Date.now() - start;
  const stderr = (r.stderr ?? "") + (r.stdout ?? "");
  if (r.error) {
    return {
      exitCode: null,
      durationMs,
      stderr,
      error: String(r.error.message ?? r.error),
    };
  }
  return { exitCode: typeof r.status === "number" ? r.status : 1, durationMs, stderr };
}

function resultFromExit(
  exitCode: number | null,
  stderr: string,
  error?: string
): { result: ProofRunResult; envNotes: string[] } {
  const envNotes: string[] = [];
  if (error) envNotes.push(`spawn: ${error}`);
  if (exitCode === null) {
    return { result: "inconclusive", envNotes };
  }
  if (exitCode === 0) {
    return { result: "pass", envNotes };
  }
  if (/no tests found/i.test(stderr) || /Test files.*0 match/i.test(stderr)) {
    envNotes.push("runner reported no tests (file may be empty or not a test module).");
    return { result: "inconclusive", envNotes };
  }
  return { result: "fail", envNotes };
}

export interface RunProofHarnessOptions {
  /** Absolute path to project JSON from formatProjectJson. */
  fromJson: string;
  /** Write log here (default: proof-run-log.json next to fromJson). */
  outputLog?: string;
}

/**
 * For each finding with proofGeneration.generatedPath or generatedTest, run node --test.
 */
export function runProofHarness(options: RunProofHarnessOptions): ProofRunLog {
  const fromJson = resolve(options.fromJson);
  if (!existsSync(fromJson)) {
    throw new Error(`Proof harness: JSON not found: ${fromJson}`);
  }
  const text = readFileSync(fromJson, "utf-8");
  const rows = rowsFromJson(text);
  const findings = rows.length ? rows.map(syntheticFindingFromRow) : loadFindingsFromProjectJson(text);

  const outPath = options.outputLog ?? join(dirname(fromJson), "proof-run-log.json");
  const entries: ProofRunEntry[] = [];
  let pass = 0;
  let fail = 0;
  let inconclusive = 0;
  let executed = 0;
  let totalDurationMs = 0;

  for (const f of findings) {
    const pg = f.proofGeneration;
    const rawPath = pg?.generatedPath ?? f.generatedTest;
    const proofGenerated = !!(pg?.wasGenerated && rawPath);
    const findingId = computeFindingId(f);

    if (!rawPath || typeof rawPath !== "string") {
      entries.push({
        findingId,
        ruleId: f.ruleId,
        generatedPath: "",
        proofGenerated,
        proofExecuted: false,
        result: "inconclusive",
        durationMs: 0,
        exitCode: null,
        envNotes: ["No generated proof path on this finding."],
      });
      inconclusive++;
      continue;
    }

    const testPath = resolveProofPath(fromJson, rawPath);
    if (!existsSync(testPath)) {
      entries.push({
        findingId,
        ruleId: f.ruleId,
        generatedPath: testPath,
        proofGenerated,
        proofExecuted: false,
        result: "inconclusive",
        durationMs: 0,
        exitCode: null,
        envNotes: [`File not found: ${testPath}`],
      });
      inconclusive++;
      continue;
    }

    executed++;
    const run = runOneTestFile(testPath);
    totalDurationMs += run.durationMs;
    const { result, envNotes } = resultFromExit(run.exitCode, run.stderr, run.error);
    if (result === "pass") pass++;
    else if (result === "fail") fail++;
    else inconclusive++;

    const stderrTail =
      run.stderr.length > 400 ? `${run.stderr.slice(-400)}` : run.stderr || undefined;

    entries.push({
      findingId,
      ruleId: f.ruleId,
      generatedPath: testPath,
      proofGenerated,
      proofExecuted: true,
      result,
      durationMs: run.durationMs,
      exitCode: run.exitCode,
      ...(stderrTail ? { stderrTail } : {}),
      ...(envNotes.length ? { envNotes } : {}),
    });
  }

  const log: ProofRunLog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    fromJson,
    entries,
    summary: {
      total: entries.length,
      executed,
      pass,
      fail,
      inconclusive,
      totalDurationMs,
    },
  };

  writeFileSync(outPath, JSON.stringify(log, null, 2), "utf-8");
  return log;
}

/** Serialize log to path (for callers that already built log in memory). */
export function writeProofRunLog(log: ProofRunLog, outputPath: string): void {
  writeFileSync(outputPath, JSON.stringify(log, null, 2), "utf-8");
}

export function proofRunLogToJson(log: ProofRunLog): string {
  return JSON.stringify(log, null, 2);
}
