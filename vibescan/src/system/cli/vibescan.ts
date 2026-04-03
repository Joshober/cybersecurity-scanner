#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import process from "node:process";
import type { Finding } from "../types.js";
import { computeFindingId } from "../evidence.js";
import { runVibeScanProjectBootstrap } from "./projectInit.js";
import { runProofHarness } from "../proof/runner.js";
const scanCliPath = join(__dirname, "index.js");
const secureArchCliPath = join(__dirname, "../../node_modules/@secure-arch/cli/dist/cli.js");

function spawnCli(cliPath: string, args: string[]): number {
  const r = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  if (typeof r.status === "number") return r.status;
  if (r.error) {
    console.error(r.error);
  }
  return 1;
}

function loadFindingsFromSavedJson(text: string): Record<string, unknown>[] {
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
  };
}

function matchFindingRow(rows: Record<string, unknown>[], targetId: string): Record<string, unknown> | undefined {
  for (const o of rows) {
    if (o.findingId === targetId) return o;
  }
  for (const o of rows) {
    try {
      if (computeFindingId(syntheticFindingFromRow(o)) === targetId) return o;
    } catch {
      continue;
    }
  }
  return undefined;
}

function runReproduceCli(argv: string[]): number {
  const rest = argv.slice(1);
  let fromPath: string | undefined;
  const pos: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--from" && rest[i + 1]) {
      fromPath = resolve(rest[++i]);
      continue;
    }
    if (!rest[i].startsWith("-")) pos.push(rest[i]);
  }
  const findingId = pos[0];
  if (!findingId || !fromPath) {
    console.error("Usage: vibescan reproduce <findingId> --from <project.json>");
    console.error("  findingId: value of findingId from `vibescan scan --format json` (or stable id recomputed from rule/line/file).");
    return 1;
  }
  if (!existsSync(fromPath)) {
    console.error(`File not found: ${fromPath}`);
    return 1;
  }
  const rows = loadFindingsFromSavedJson(readFileSync(fromPath, "utf-8"));
  const match = matchFindingRow(rows, findingId);
  if (!match) {
    console.error(`No finding with id ${findingId} in ${fromPath}`);
    return 1;
  }
  const pg = match.proofGeneration as { generatedPath?: string } | undefined;
  const rawPath = pg?.generatedPath;
  if (!rawPath || typeof rawPath !== "string") {
    console.error(
      "This finding has no generated proof test (proofGeneration.generatedPath). Run `vibescan prove` or `vibescan scan --generate-tests` first."
    );
    return 1;
  }
  const testPath = isAbsolute(rawPath) ? rawPath : resolve(dirname(fromPath), rawPath);
  if (!existsSync(testPath)) {
    console.error(`Proof file not found: ${testPath}`);
    return 1;
  }
  console.error(`Running: node --test ${testPath}`);
  const r = spawnSync(process.execPath, ["--test", testPath], { stdio: "inherit" });
  return typeof r.status === "number" ? r.status : 1;
}

function main(): void {
  const argv = process.argv.slice(2);
  const first = String(argv[0] ?? "");

  if (first === "reproduce") {
    process.exit(runReproduceCli(argv));
  }

  if (first === "prove") {
    const rest = argv.slice(1);
    if (rest[0] === "--run") {
      let fromPath: string | undefined;
      let outLog: string | undefined;
      let retries: number | undefined;
      for (let i = 1; i < rest.length; i++) {
        if (rest[i] === "--from" && rest[i + 1]) {
          fromPath = resolve(rest[++i]);
          continue;
        }
        if (rest[i] === "--output" && rest[i + 1]) {
          outLog = resolve(rest[++i]);
          continue;
        }
        if (rest[i] === "--retries" && rest[i + 1]) {
          retries = parseInt(rest[++i], 10);
          continue;
        }
      }
      if (!fromPath) {
        console.error(
          "Usage: vibescan prove --run --from <project.json> [--output <proof-run-log.json>] [--retries N]"
        );
        process.exit(1);
      }
      try {
        const log = runProofHarness({ fromJson: fromPath, outputLog: outLog, retries });
        const logPath = outLog ?? join(dirname(fromPath), "proof-run-log.json");
        const flaky = "flaky" in log.summary ? `, ${log.summary.flaky} flaky` : "";
        console.error(
          `Proof run: ${log.summary.pass} pass, ${log.summary.fail} fail, ${log.summary.inconclusive} inconclusive (${log.summary.executed} executed${flaky}). Wrote ${logPath}`
        );
        process.exit(log.summary.fail > 0 ? 1 : 0);
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    }
    let genDir: string | undefined;
    const filtered: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--output" && rest[i + 1]) {
        genDir = rest[++i];
        continue;
      }
      filtered.push(rest[i]);
    }
    const paths = filtered.filter((a) => !a.startsWith("-"));
    const flags = filtered.filter((a) => a.startsWith("-"));
    const scanArgs = [...(paths.length > 0 ? paths : ["."]), ...flags, "--generate-tests"];
    if (genDir) scanArgs.push(genDir);
    if (!existsSync(scanCliPath)) {
      console.error(`Missing scan CLI: ${scanCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(scanCliPath, scanArgs));
  }

  if (first === "fix-preview") {
    void import("./fixPreview.js")
      .then((m) => {
        const rest = argv.slice(1);
        let projectRoot: string | undefined;
        let patchFile: string | undefined;
        let outJson: string | undefined;
        let retries: number | undefined;
        let fromProjectJson: string | undefined;
        let findingId: string | undefined;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === "--project-root" && rest[i + 1]) {
            projectRoot = resolve(rest[++i]);
            continue;
          }
          if (rest[i] === "--patch" && rest[i + 1]) {
            patchFile = resolve(rest[++i]);
            continue;
          }
          if (rest[i] === "--from" && rest[i + 1]) {
            fromProjectJson = resolve(rest[++i]);
            continue;
          }
          if (rest[i] === "--finding-id" && rest[i + 1]) {
            findingId = rest[++i];
            continue;
          }
          if (rest[i] === "--output" && rest[i + 1]) {
            outJson = resolve(rest[++i]);
            continue;
          }
          if (rest[i] === "--retries" && rest[i + 1]) {
            retries = parseInt(rest[++i], 10);
            continue;
          }
        }
        if (!projectRoot || !patchFile) {
          console.error(
            "Usage: vibescan fix-preview --project-root <dir> --patch <file.diff> [--from <project.json> --finding-id <id>] [--output <result.json>] [--retries N]"
          );
          process.exit(1);
        }
        const r = m.runFixPreview({
          projectRoot,
          patchFile,
          retries,
          fromProjectJson,
          findingId,
        });
        const payload = JSON.stringify(r, null, 2);
        if (outJson) {
          writeFileSync(outJson, payload, "utf-8");
          console.error(`Wrote ${outJson}`);
        } else {
          console.log(payload);
        }
        m.cleanupFixPreviewTemps(r);
        process.exit(0);
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
    return;
  }

  if (first === "import-sarif") {
    void import("../importers/sarif/cli.js")
      .then((m) => m.runImportSarifCli(argv.slice(1)))
      .then((code) => process.exit(code))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
    return;
  }

  if (first === "comparison-report") {
    void import("../reports/comparison/cli.js")
      .then((m) => m.runComparisonReportCli(argv.slice(1)))
      .then((code) => process.exit(code))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
    return;
  }

  if (first === "export-ai-rules") {
    void import("./exportAiRules.js")
      .then((m) => m.runExportAiRulesCliAsync(argv.slice(1), __dirname))
      .then((code) => process.exit(code))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
    return;
  }

  if (first === "secure-arch") {
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(secureArchCliPath, argv.slice(1)));
  }

  if (first === "init") {
    const boot = runVibeScanProjectBootstrap(__dirname, process.cwd());
    for (const c of boot.created) console.log(`vibescan init: created ${c}`);
    for (const s of boot.skipped) console.log(`vibescan init: ${s}`);
    const pkgRoot = resolve(__dirname, "..", "..", "..");
    console.error(`vibescan init: proof rule SDK — see ${join(pkgRoot, "templates", "proof-rule-sdk", "README.md")}`);
    if (!existsSync(secureArchCliPath)) {
      console.error(`Missing vendored secure-arch CLI: ${secureArchCliPath}`);
      process.exit(1);
    }
    process.exit(spawnCli(secureArchCliPath, argv));
  }

  // Default: route everything else to the existing scan CLI (`index.js`).
  if (!existsSync(scanCliPath)) {
    console.error(`Missing scan CLI: ${scanCliPath}`);
    process.exit(1);
  }
  process.exit(spawnCli(scanCliPath, argv));
}

main();

