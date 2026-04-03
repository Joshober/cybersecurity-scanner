/**
 * Apply a unified diff in a temp tree and compare proof harness results before/after.
 */

import { readFileSync, mkdtempSync, rmSync, cpSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { collectScanFiles } from "./collectFiles.js";
import { scanProject } from "../scanner.js";
import { formatProjectJson } from "../format.js";
import { emitProofTests } from "../proof/pipeline.js";
import {
  runProofHarness,
  findProofRunEntryByFindingId,
  type ProofRunLog,
  type ProofRunEntry,
} from "../proof/runner.js";
import type { ScannerOptions } from "../types.js";

export interface FixPreviewOptions {
  projectRoot: string;
  patchFile: string;
  retries?: number;
  /** Saved project JSON (formatProjectJson); required with `findingId`. */
  fromProjectJson?: string;
  /** Stable id from JSON `findingId`; requires `fromProjectJson`. */
  findingId?: string;
}

/** Per-finding proof status before vs after patch (optional). */
export interface FixPreviewFindingDiff {
  lookup: "matched" | "not_in_from_json";
  before?: ProofRunEntry;
  after?: ProofRunEntry;
  /** True when both entries exist and `result` differs. */
  resultChanged: boolean;
}

export interface FixPreviewResult {
  version: 1;
  projectRoot: string;
  patchFile: string;
  tempBefore: string;
  tempAfter: string;
  applyMethod: "git_apply" | "patch_cli" | "none";
  proofLogBefore: ProofRunLog | null;
  proofLogAfter: ProofRunLog | null;
  summaryBeforeFindings: number;
  summaryAfterFindings: number;
  /** Set when `--from` + `--finding-id` passed to CLI. */
  fromProjectJson?: string;
  findingId?: string;
  findingDiff?: FixPreviewFindingDiff;
}

function copyWorkspace(src: string, dest: string): void {
  cpSync(src, dest, {
    recursive: true,
    filter: (s) => {
      const n = s.replace(/\\/g, "/");
      return !n.includes("/node_modules/") && !n.endsWith("/node_modules");
    },
  });
}

function applyPatchToDir(targetDir: string, patchAbs: string): { ok: boolean; method: FixPreviewResult["applyMethod"] } {
  const patchTry = spawnSync("patch", ["-p1", "-i", patchAbs], { cwd: targetDir, encoding: "utf-8" });
  if (patchTry.status === 0) return { ok: true, method: "patch_cli" };

  spawnSync("git", ["init"], { cwd: targetDir, stdio: "ignore" });
  const gitTry = spawnSync("git", ["apply", "--whitespace=nowarn", patchAbs], {
    cwd: targetDir,
    encoding: "utf-8",
  });
  if (gitTry.status === 0) return { ok: true, method: "git_apply" };
  return { ok: false, method: "none" };
}

function scanToProjectJson(root: string, proofsRel: string): { jsonPath: string; findings: number } {
  const scanOpts: ScannerOptions = { projectRoot: root, excludeVendor: true };
  const paths = collectScanFiles([root], scanOpts);
  const files = paths.map((path) => ({
    path,
    source: readFileSync(path, "utf-8"),
  }));
  const project = scanProject(files, scanOpts);
  const proofDir = join(root, proofsRel);
  emitProofTests(project.findings, proofDir, { projectRoot: root });
  const jsonPath = join(root, "vibescan-fix-preview-project.json");
  writeFileSync(
    jsonPath,
    formatProjectJson(project, { benchmarkMetadata: true, includeRuleFamily: true }),
    "utf-8"
  );
  return { jsonPath, findings: project.findings.length };
}

function findingIdInSavedProjectJson(absPath: string, findingId: string): boolean {
  const text = readFileSync(absPath, "utf-8");
  const j = JSON.parse(text) as { findings?: Array<{ findingId?: string }> };
  const rows = Array.isArray(j.findings) ? j.findings : [];
  return rows.some((r) => r.findingId === findingId);
}

function buildFindingDiff(
  fromPath: string | undefined,
  findingId: string | undefined,
  logBefore: ProofRunLog,
  logAfter: ProofRunLog
): FixPreviewFindingDiff | undefined {
  if (!fromPath || !findingId) return undefined;
  const lookup = findingIdInSavedProjectJson(fromPath, findingId) ? "matched" : "not_in_from_json";
  const before = findProofRunEntryByFindingId(logBefore, findingId);
  const after = findProofRunEntryByFindingId(logAfter, findingId);
  const resultChanged =
    before != null &&
    after != null &&
    before.result !== undefined &&
    after.result !== undefined &&
    before.result !== after.result;
  return { lookup, before, after, resultChanged };
}

export function runFixPreview(options: FixPreviewOptions): FixPreviewResult {
  const fromJsonOpt = options.fromProjectJson;
  const findingIdOpt = options.findingId;
  if ((fromJsonOpt && !findingIdOpt) || (!fromJsonOpt && findingIdOpt)) {
    throw new Error("fix-preview: `--from` and `--finding-id` must be passed together (or neither).");
  }
  if (fromJsonOpt && findingIdOpt) {
    const p = resolve(fromJsonOpt);
    if (!existsSync(p)) {
      throw new Error(`fix-preview: --from file not found: ${p}`);
    }
  }

  const projectRoot = resolve(options.projectRoot);
  const patchAbs = resolve(options.patchFile);
  if (!existsSync(patchAbs)) {
    throw new Error(`Patch file not found: ${patchAbs}`);
  }
  readFileSync(patchAbs, "utf-8");

  const tempBefore = mkdtempSync(join(tmpdir(), "vibescan-fix-before-"));
  const tempAfter = mkdtempSync(join(tmpdir(), "vibescan-fix-after-"));
  copyWorkspace(projectRoot, tempBefore);
  copyWorkspace(tempBefore, tempAfter);

  const applied = applyPatchToDir(tempAfter, patchAbs);
  if (!applied.ok) {
    rmSync(tempBefore, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    rmSync(tempAfter, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    throw new Error(
      "Could not apply patch in temp tree. Install `patch` (e.g. Git Bash) or ensure `git apply` works after `git init` in the target directory."
    );
  }

  const retries = options.retries;
  const proofsRel = "vibescan-fix-proofs";
  const beforeScan = scanToProjectJson(tempBefore, proofsRel);
  const afterScan = scanToProjectJson(tempAfter, proofsRel);

  const proofLogBefore = runProofHarness({
    fromJson: beforeScan.jsonPath,
    retries,
  });
  const proofLogAfter = runProofHarness({
    fromJson: afterScan.jsonPath,
    retries,
  });

  const fromResolved = fromJsonOpt ? resolve(fromJsonOpt) : undefined;
  const findingDiff =
    fromResolved && findingIdOpt
      ? buildFindingDiff(fromResolved, findingIdOpt, proofLogBefore, proofLogAfter)
      : undefined;

  return {
    version: 1,
    projectRoot,
    patchFile: relative(projectRoot, patchAbs) || patchAbs,
    tempBefore,
    tempAfter,
    applyMethod: applied.method,
    proofLogBefore,
    proofLogAfter,
    summaryBeforeFindings: beforeScan.findings,
    summaryAfterFindings: afterScan.findings,
    ...(fromResolved && findingIdOpt
      ? { fromProjectJson: relative(projectRoot, fromResolved) || fromResolved, findingId: findingIdOpt }
      : {}),
    ...(findingDiff ? { findingDiff } : {}),
  };
}

export function cleanupFixPreviewTemps(r: FixPreviewResult): void {
  try {
    rmSync(r.tempBefore, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    /* ignore */
  }
  try {
    rmSync(r.tempAfter, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    /* ignore */
  }
}
