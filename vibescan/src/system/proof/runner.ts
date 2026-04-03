/**
 * Run generated `.test.mjs` proofs (node --test) and record structured results for CI.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { computeFindingId } from "../evidence.js";
import type { Finding } from "../types.js";

export type ProofRunResult = "pass" | "fail" | "inconclusive";

/** Per-attempt outcome when `--retries` > 1. */
export type ProofRunStability = "stable" | "flaky" | "error";

export interface ProofRunAttempt {
  durationMs: number;
  exitCode: number | null;
  result: ProofRunResult;
}

export interface ProofRunEntry {
  findingId: string;
  ruleId: string;
  generatedPath: string;
  proofGenerated: boolean;
  proofExecuted: boolean;
  result: ProofRunResult;
  /** Last run exit code (same as final attempt when retries=1). */
  exitCode: number | null;
  /** Sum of all attempt durations. */
  durationMs: number;
  stderrTail?: string;
  /** Heuristic: non-zero exit with empty tests or spawn error. */
  envNotes?: string[];
  /** Number of `node --test` attempts for this proof file. */
  retries?: number;
  /** Each attempt’s outcome (length equals retries when executed). */
  perRun?: ProofRunAttempt[];
  /** stable: all attempts agreed; flaky: mixed pass/fail; error: spawn or no-tests. */
  stability?: ProofRunStability;
}

export interface ProofRunLog {
  version: 1;
  generatedAt: string;
  fromJson?: string;
  /** Retries per proof file (default 1). */
  retriesPerFile?: number;
  entries: ProofRunEntry[];
  summary: {
    total: number;
    executed: number;
    pass: number;
    fail: number;
    inconclusive: number;
    /** Entries where stability is flaky (omitted in older logs). */
    flaky?: number;
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
  /** Run each proof test file this many times (default 1). Mixed outcomes mark flaky. */
  retries?: number;
}

function aggregateRetries(attempts: ProofRunAttempt[]): {
  result: ProofRunResult;
  stability: ProofRunStability;
  durationMs: number;
  exitCode: number | null;
  envNotes: string[];
} {
  const durationMs = attempts.reduce((s, a) => s + a.durationMs, 0);
  const last = attempts[attempts.length - 1];
  const exitCode = last?.exitCode ?? null;
  const outcomes = attempts.map((a) => a.result);
  const hasPass = outcomes.includes("pass");
  const hasFail = outcomes.includes("fail");
  const hasInc = outcomes.includes("inconclusive");

  if (outcomes.every((o) => o === "pass")) {
    return { result: "pass", stability: "stable", durationMs, exitCode, envNotes: [] };
  }
  if (outcomes.every((o) => o === "fail")) {
    return { result: "fail", stability: "stable", durationMs, exitCode, envNotes: [] };
  }
  if (hasPass && hasFail) {
    return {
      result: "inconclusive",
      stability: "flaky",
      durationMs,
      exitCode,
      envNotes: ["Mixed pass/fail across retries."],
    };
  }
  if ((hasPass || hasFail) && hasInc) {
    return {
      result: "inconclusive",
      stability: "flaky",
      durationMs,
      exitCode,
      envNotes: ["Mixed outcomes across retries (includes inconclusive)."],
    };
  }
  const spawnFail = attempts.some((a) => a.exitCode === null);
  return {
    result: "inconclusive",
    stability: spawnFail ? "error" : "stable",
    durationMs,
    exitCode,
    envNotes: spawnFail ? ["Runner error on at least one attempt (null exit)."] : [],
  };
}

/**
 * For each finding with proofGeneration.generatedPath or generatedTest, run node --test.
 */
export function runProofHarness(options: RunProofHarnessOptions): ProofRunLog {
  const fromJson = resolve(options.fromJson);
  if (!existsSync(fromJson)) {
    throw new Error(`Proof harness: JSON not found: ${fromJson}`);
  }
  const retries = Math.max(1, Math.min(20, options.retries ?? 1));
  const text = readFileSync(fromJson, "utf-8");
  const rows = rowsFromJson(text);
  const findings = rows.length ? rows.map(syntheticFindingFromRow) : loadFindingsFromProjectJson(text);

  const outPath = options.outputLog ?? join(dirname(fromJson), "proof-run-log.json");
  const entries: ProofRunEntry[] = [];
  let pass = 0;
  let fail = 0;
  let inconclusive = 0;
  let flaky = 0;
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
        stability: "error",
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
        stability: "error",
      });
      inconclusive++;
      continue;
    }

    executed++;
    const attempts: ProofRunAttempt[] = [];
    let lastStderr = "";
    for (let i = 0; i < retries; i++) {
      const run = runOneTestFile(testPath);
      lastStderr = run.stderr;
      const { result: r0 } = resultFromExit(run.exitCode, run.stderr, run.error);
      attempts.push({
        durationMs: run.durationMs,
        exitCode: run.exitCode,
        result: r0,
      });
    }

    const agg = aggregateRetries(attempts);
    totalDurationMs += agg.durationMs;
    if (agg.stability === "flaky") flaky++;
    if (agg.result === "pass") pass++;
    else if (agg.result === "fail") fail++;
    else inconclusive++;

    const stderrTail =
      lastStderr.length > 400 ? `${lastStderr.slice(-400)}` : lastStderr || undefined;

    entries.push({
      findingId,
      ruleId: f.ruleId,
      generatedPath: testPath,
      proofGenerated,
      proofExecuted: true,
      result: agg.result,
      durationMs: agg.durationMs,
      exitCode: agg.exitCode,
      retries,
      perRun: attempts,
      stability: agg.stability,
      ...(stderrTail ? { stderrTail } : {}),
      ...(agg.envNotes.length ? { envNotes: agg.envNotes } : {}),
    });
  }

  const log: ProofRunLog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    fromJson,
    retriesPerFile: retries,
    entries,
    summary: {
      total: entries.length,
      executed,
      pass,
      fail,
      inconclusive,
      flaky,
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
