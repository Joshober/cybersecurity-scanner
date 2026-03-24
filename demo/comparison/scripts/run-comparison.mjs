#!/usr/bin/env node
/**
 * Local comparison harness over curated gold-path cases (synthetic snippets only).
 * Run from monorepo root: node demo/comparison/scripts/run-comparison.mjs
 *
 * Options:
 *   --date YYYY-MM-DD   (default: local calendar date)
 *   --cases id1,id2     (default: all cases with meta.json)
 *   --check-determinism run VibeScan twice per case and set stableAcrossReruns from rule-id equality
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import fg from "fast-glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPARISON_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(COMPARISON_ROOT, "..", "..");
const CASES_DIR = path.join(COMPARISON_ROOT, "cases");
const ESLINT_CONFIG = path.join(COMPARISON_ROOT, "tools", "baselines", "eslint.eslintrc.cjs");
const VIBESCAN_DIST = path.join(REPO_ROOT, "vibescan", "dist", "system", "index.js");

function parseArgs(argv) {
  const out = { date: null, cases: null, checkDeterminism: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date" && argv[i + 1]) out.date = argv[++i];
    else if (a === "--cases" && argv[i + 1])
      out.cases = argv[i++]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--check-determinism") out.checkDeterminism = true;
  }
  if (!out.date) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    out.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return out;
}

function listCases(filter) {
  const names = readdirSync(CASES_DIR).filter((n) => {
    const p = path.join(CASES_DIR, n, "meta.json");
    return existsSync(p) && statSync(path.join(CASES_DIR, n)).isDirectory();
  });
  const sorted = names.sort();
  if (!filter?.length) return sorted;
  return sorted.filter((id) => filter.includes(id));
}

async function collectScanEntries(scanRoot) {
  const patterns = ["**/*.js", "**/*.ts", "**/*.mjs", "**/*.cjs"];
  const files = await fg(patterns, {
    cwd: scanRoot,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
    dot: false,
  });
  const entries = [];
  let bytes = 0;
  for (const filePath of files.slice(0, 500)) {
    const source = await fs.readFile(filePath, "utf8");
    bytes += Buffer.byteLength(source);
    if (bytes > 4 * 1024 * 1024) break;
    entries.push({ path: filePath, source });
  }
  return entries;
}

async function runVibeScan(scanRoot) {
  if (!existsSync(VIBESCAN_DIST)) {
    throw new Error(`Missing ${VIBESCAN_DIST}. Run: npm run build -w vibescan`);
  }
  const scanner = await import(pathToFileURL(VIBESCAN_DIST).href);
  const { scanProjectAsync } = scanner;
  const entries = await collectScanEntries(scanRoot);
  const options = { crypto: true, injection: true, severityThreshold: "info" };
  return scanProjectAsync(entries, options, scanRoot);
}

function ruleIdSet(project) {
  return new Set((project.findings || []).map((f) => f.ruleId));
}

function evaluateVibeScan(project, expectedRuleIds) {
  const ids = ruleIdSet(project);
  const matched = expectedRuleIds.filter((r) => ids.has(r));
  const detected = matched.length > 0;
  const fps = (project.findings || []).filter((f) => !expectedRuleIds.includes(f.ruleId));
  return { detected, matchedRuleIds: matched, findingCount: project.findings?.length ?? 0, falsePositives: fps };
}

function relFromRepo(absPath) {
  if (!absPath) return absPath;
  const r = path.relative(REPO_ROOT, absPath);
  return r.split(path.sep).join("/");
}

function slimFindings(project) {
  return (project.findings || []).map((f) => ({
    ruleId: f.ruleId,
    severity: f.severity,
    severityLabel: f.severityLabel,
    message: f.message,
    filePath: relFromRepo(f.filePath),
    line: f.line,
  }));
}

function runEslint(targetDir) {
  const r = spawnSync("npx", ["eslint", "-c", ESLINT_CONFIG, "-f", "json", targetDir], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 20_000_000,
    shell: true,
  });
  const out = r.stdout?.trim() || "";
  let messages = [];
  try {
    messages = out ? JSON.parse(out) : [];
  } catch {
    return {
      ok: false,
      error: r.stderr || "eslint json parse error",
      rawStdout: out.slice(0, 2000),
      exitCode: r.status,
    };
  }
  const securityMsgs = [];
  for (const file of messages) {
    for (const m of file.messages || []) {
      if (m.ruleId) {
        securityMsgs.push({
          ruleId: m.ruleId,
          message: m.message,
          line: m.line,
          filePath: file.filePath,
        });
      }
    }
  }
  return { ok: true, files: messages, securityMessages: securityMsgs, exitCode: r.status };
}

function parseNpmAuditJson(stdout) {
  let data = {};
  try {
    data = stdout ? JSON.parse(stdout) : {};
  } catch {
    return { parseError: true };
  }
  let total = 0;
  const metaV = data.metadata?.vulnerabilities;
  if (metaV && typeof metaV === "object") {
    if (typeof metaV.total === "number") total = metaV.total;
    else {
      for (const k of ["info", "low", "moderate", "medium", "high", "critical"]) {
        const v = metaV[k];
        if (typeof v === "number") total += v;
      }
    }
  }
  if (total === 0 && data.vulnerabilities && typeof data.vulnerabilities === "object") {
    total = Object.keys(data.vulnerabilities).length;
  }
  return { data, advisoryCount: total };
}

function runNpmAudit() {
  if (!existsSync(path.join(COMPARISON_ROOT, "node_modules"))) {
    return { skipped: true, reason: "Run npm install in demo/comparison for npm audit" };
  }
  const r = spawnSync("npm", ["audit", "--json"], {
    cwd: COMPARISON_ROOT,
    encoding: "utf8",
    maxBuffer: 20_000_000,
    shell: true,
  });
  const parsed = parseNpmAuditJson(r.stdout || "");
  if (parsed.parseError) {
    return { skipped: false, parseError: true, stdout: r.stdout?.slice(0, 1500), exitCode: r.status };
  }
  return {
    skipped: false,
    exitCode: r.status,
    advisoryCount: parsed.advisoryCount,
    metadata: parsed.data.metadata,
    vulnerabilityKeys: parsed.data.vulnerabilities ? Object.keys(parsed.data.vulnerabilities).length : 0,
  };
}

function commandExists(cmd) {
  const which = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(which, [cmd], { encoding: "utf8", shell: true });
  return r.status === 0;
}

function runBearer(targetDir) {
  if (!commandExists("bearer")) {
    return { skipped: true, reason: "bearer not on PATH" };
  }
  const r = spawnSync("bearer", ["scan", targetDir, "--format", "json", "--quiet"], {
    encoding: "utf8",
    maxBuffer: 20_000_000,
    cwd: REPO_ROOT,
    shell: true,
  });
  let json = null;
  try {
    json = r.stdout?.trim() ? JSON.parse(r.stdout) : null;
  } catch {
    json = { parseError: true, raw: r.stdout?.slice(0, 4000), stderr: r.stderr?.slice(0, 2000) };
  }
  return { skipped: false, exitCode: r.status, json };
}

function runSnyk(targetDir) {
  if (!commandExists("snyk")) {
    return { skipped: true, reason: "snyk not on PATH" };
  }
  const r = spawnSync("snyk", ["code", "test", targetDir, "--json"], {
    encoding: "utf8",
    maxBuffer: 20_000_000,
    cwd: REPO_ROOT,
    shell: true,
  });
  let json = null;
  try {
    json = r.stdout?.trim() ? JSON.parse(r.stdout) : null;
  } catch {
    json = { parseError: true, raw: r.stdout?.slice(0, 4000) };
  }
  return { skipped: false, exitCode: r.status, json };
}

function toolDimensions(toolName, partial) {
  return {
    tool: toolName,
    detectedExpectedIssue: partial.detectedExpectedIssue,
    matchedRulesOrFindings: partial.matchedRulesOrFindings ?? [],
    falsePositiveCount: partial.falsePositiveCount ?? null,
    falsePositiveNote: partial.falsePositiveNote,
    deterministicRerun: partial.deterministicRerun ?? null,
    producesReusableOutput: partial.producesReusableOutput ?? null,
    ciEnforceable: partial.ciEnforceable ?? null,
    regressionTestSupport: partial.regressionTestSupport ?? null,
    fixSuggested: partial.fixSuggested ?? null,
    fixCorrect: partial.fixCorrect ?? null,
    stableAcrossReruns: partial.stableAcrossReruns ?? null,
  };
}

async function loadJsonIfExists(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function ensureDir(d) {
  await fs.mkdir(d, { recursive: true });
}

function csvEscape(s) {
  const t = String(s ?? "");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function bearerHasSignal(raw) {
  if (!raw || raw.skipped) return false;
  const j = raw.json;
  if (!j || j.parseError) return raw.exitCode !== 0;
  if (Array.isArray(j)) return j.length > 0;
  if (typeof j.findings_count === "number") return j.findings_count > 0;
  if (Array.isArray(j.findings)) return j.findings.length > 0;
  if (j.high_count || j.critical_count) return true;
  return raw.exitCode !== 0;
}

function snykHasSignal(raw) {
  if (!raw || raw.skipped) return false;
  if (raw.json?.parseError) return raw.exitCode !== 0;
  if (Array.isArray(raw.json)) return raw.json.length > 0;
  if (raw.json?.runs?.[0]?.results?.length) return true;
  return raw.exitCode !== 0;
}

function yn(v) {
  if (v === null || v === undefined) return "";
  return v ? "yes" : "no";
}

async function main() {
  const args = parseArgs(process.argv);
  const caseIds = listCases(args.cases);
  if (!caseIds.length) {
    console.error("No cases found under", CASES_DIR);
    process.exit(1);
  }

  const outRoot = path.join(COMPARISON_ROOT, "results", args.date);
  await ensureDir(outRoot);

  const npmAuditGlobal = runNpmAudit();
  await fs.writeFile(path.join(outRoot, "npm-audit-shared.json"), JSON.stringify(npmAuditGlobal, null, 2), "utf8");

  const npmAuditHasAdvisories =
    !npmAuditGlobal.skipped &&
    !npmAuditGlobal.parseError &&
    (npmAuditGlobal.advisoryCount > 0 || npmAuditGlobal.vulnerabilityKeys > 0);

  const aggregateRows = [];
  const toolAggregate = {
    vibescan: {
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    eslint: {
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    npmAudit: {
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: false,
    },
    bearer: {
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    snyk: {
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    ai: {
      explicitCoverage: false,
      stableReruns: false,
      policyGate: false,
      regressionProtection: false,
    },
  };

  for (const cid of caseIds) {
    const caseDir = path.join(CASES_DIR, cid);
    const vulnDir = path.join(caseDir, "vulnerable");
    const meta = JSON.parse(await fs.readFile(path.join(caseDir, "meta.json"), "utf8"));
    const expectedFile = (await loadJsonIfExists(path.join(caseDir, "expected.json"))) || {};
    const expectedRuleIds =
      expectedFile.expectedRuleIds || meta.expectedRuleIds || meta.vulnerableRuleIds || [];

    const caseOut = path.join(outRoot, cid);
    await ensureDir(caseOut);

    const vibescanProject = await runVibeScan(vulnDir);
    const eval1 = evaluateVibeScan(vibescanProject, expectedRuleIds);
    let stableAcrossReruns = true;
    if (args.checkDeterminism) {
      const second = await runVibeScan(vulnDir);
      const a = [...ruleIdSet(vibescanProject)].sort().join(",");
      const b = [...ruleIdSet(second)].sort().join(",");
      stableAcrossReruns = a === b;
    }

    const vibescanRecord = toolDimensions("vibescan", {
      detectedExpectedIssue: eval1.detected,
      matchedRulesOrFindings: eval1.matchedRuleIds,
      falsePositiveCount: eval1.falsePositives.length,
      falsePositiveNote:
        eval1.falsePositives.length > 0
          ? "Findings with rule IDs outside expectedRuleIds (golden set is minimal; may still be true positives)"
          : "",
      deterministicRerun: true,
      producesReusableOutput: true,
      ciEnforceable: true,
      regressionTestSupport: true,
      fixSuggested: false,
      fixCorrect: null,
      stableAcrossReruns,
    });

    await fs.writeFile(
      path.join(caseOut, "vibescan.json"),
      JSON.stringify(
        {
          findings: slimFindings(vibescanProject),
          findingCount: eval1.findingCount,
          record: vibescanRecord,
        },
        null,
        2
      ),
      "utf8"
    );

    const eslintRaw = runEslint(vulnDir);
    const eslintSignal = eslintRaw.ok && eslintRaw.securityMessages?.length > 0;
    const eslintRecord = toolDimensions("eslint-plugin-security", {
      detectedExpectedIssue: eslintSignal,
      matchedRulesOrFindings: [...new Set((eslintRaw.securityMessages || []).map((m) => m.ruleId))],
      falsePositiveCount: eslintRaw.ok
        ? eslintRaw.files.reduce((n, f) => n + (f.messages?.length || 0), 0) -
          (eslintRaw.securityMessages?.length || 0)
        : null,
      falsePositiveNote:
        "Config uses plugin:security only; signal = any ESLint message with a ruleId in vulnerable/. Not aligned to VibeScan rule IDs.",
      deterministicRerun: true,
      producesReusableOutput: true,
      ciEnforceable: true,
      regressionTestSupport: true,
      fixSuggested: null,
      fixCorrect: null,
      stableAcrossReruns: true,
    });
    await fs.writeFile(path.join(caseOut, "eslint.json"), JSON.stringify({ raw: eslintRaw, record: eslintRecord }, null, 2), "utf8");

    const npmRecord = toolDimensions("npm-audit", {
      detectedExpectedIssue: npmAuditHasAdvisories,
      matchedRulesOrFindings: npmAuditHasAdvisories ? ["dependency advisories (harness package.json)"] : [],
      falsePositiveNote:
        "Single shared audit for demo/comparison/package.json — same value for every case; does not target inline bug class.",
      deterministicRerun: true,
      producesReusableOutput: true,
      ciEnforceable: true,
      regressionTestSupport: false,
      fixSuggested: null,
      fixCorrect: null,
      stableAcrossReruns: true,
    });
    await fs.writeFile(
      path.join(caseOut, "npm-audit.json"),
      JSON.stringify(
        { sharedArtifact: `../npm-audit-shared.json`, globalAudit: npmAuditGlobal, record: npmRecord },
        null,
        2
      ),
      "utf8"
    );

    const bearerRaw = runBearer(vulnDir);
    const bearerHit = bearerHasSignal(bearerRaw);
    const bearerRecord = toolDimensions("bearer", {
      detectedExpectedIssue: bearerRaw.skipped ? null : bearerHit,
      matchedRulesOrFindings: bearerRaw.skipped ? [] : ["see bearer.json raw"],
      falsePositiveNote: bearerRaw.skipped ? bearerRaw.reason : "",
      deterministicRerun: !bearerRaw.skipped,
      producesReusableOutput: !bearerRaw.skipped,
      ciEnforceable: !bearerRaw.skipped,
      regressionTestSupport: !bearerRaw.skipped,
      stableAcrossReruns: !bearerRaw.skipped,
    });
    await fs.writeFile(path.join(caseOut, "bearer.json"), JSON.stringify({ raw: bearerRaw, record: bearerRecord }, null, 2), "utf8");

    const snykRaw = runSnyk(vulnDir);
    const snykHit = snykHasSignal(snykRaw);
    const snykRecord = toolDimensions("snyk", {
      detectedExpectedIssue: snykRaw.skipped ? null : snykHit,
      matchedRulesOrFindings: snykRaw.skipped ? [] : ["see snyk.json raw"],
      falsePositiveNote: snykRaw.skipped ? snykRaw.reason : "",
      deterministicRerun: !snykRaw.skipped,
      producesReusableOutput: !snykRaw.skipped,
      ciEnforceable: !snykRaw.skipped,
      regressionTestSupport: !snykRaw.skipped,
      stableAcrossReruns: !snykRaw.skipped,
    });
    await fs.writeFile(path.join(caseOut, "snyk.json"), JSON.stringify({ raw: snykRaw, record: snykRecord }, null, 2), "utf8");

    const aiPath = path.join(caseOut, "ai.json");
    let aiMerged = await loadJsonIfExists(aiPath);
    const hadRealCapture = aiMerged && !aiMerged._placeholder;

    if (!aiMerged) {
      const placeholder = {
        _placeholder: true,
        message: "Replace with manual capture using demo/comparison/tools/ai/result.template.json",
        promptRef: `cases/${cid}/prompt.md`,
      };
      await fs.writeFile(aiPath, JSON.stringify(placeholder, null, 2), "utf8");
      aiMerged = placeholder;
    }

    const aiRecord = hadRealCapture
      ? toolDimensions("ai", {
          detectedExpectedIssue:
            aiMerged.detectedExpectedIssue != null ? aiMerged.detectedExpectedIssue : null,
          matchedRulesOrFindings: aiMerged.matchedRulesOrFindings || [],
          falsePositiveCount: null,
          deterministicRerun: false,
          producesReusableOutput: !!(aiMerged.rawFindingsPath || aiMerged.findingsSummary),
          ciEnforceable: false,
          regressionTestSupport: false,
          fixSuggested: aiMerged.fixSuggested ?? !!aiMerged.proposedFixSnippet,
          fixCorrect: aiMerged.fixAssessedCorrect ?? null,
          stableAcrossReruns: null,
          manualFields: {
            tool: aiMerged.tool,
            modelOrVersion: aiMerged.modelOrVersion,
            capturedAtUtc: aiMerged.capturedAtUtc,
            runNumber: aiMerged.runNumber,
          },
        })
      : toolDimensions("ai", {
          detectedExpectedIssue: null,
          matchedRulesOrFindings: [],
          falsePositiveNote: "No manual ai.json capture yet (only placeholder).",
          deterministicRerun: false,
          producesReusableOutput: false,
          ciEnforceable: false,
          regressionTestSupport: false,
          fixSuggested: null,
          fixCorrect: null,
          stableAcrossReruns: null,
        });

    if (hadRealCapture) {
      await fs.writeFile(aiPath, JSON.stringify({ ...aiMerged, record: aiRecord }, null, 2), "utf8");
    } else {
      await fs.writeFile(
        aiPath,
        JSON.stringify({ ...aiMerged, record: aiRecord }, null, 2),
        "utf8"
      );
    }

    const caseSummary = {
      caseId: cid,
      title: meta.title,
      policyRelevant: meta.policyRelevant,
      verificationMode: meta.verificationMode,
      expectedRuleIds,
      tools: {
        vibescan: vibescanRecord,
        eslint: eslintRecord,
        npmAudit: npmRecord,
        bearer: bearerRecord,
        snyk: snykRecord,
        ai: aiRecord,
      },
    };
    await fs.writeFile(path.join(caseOut, "summary.json"), JSON.stringify(caseSummary, null, 2), "utf8");

    aggregateRows.push({
      case: cid,
      title: meta.title,
      vibescan: yn(eval1.detected),
      eslint: yn(eslintSignal),
      npmAudit: yn(npmAuditHasAdvisories),
      bearer: yn(bearerRecord.detectedExpectedIssue),
      snyk: yn(snykRecord.detectedExpectedIssue),
      ai:
        hadRealCapture && aiMerged.detectedExpectedIssue != null
          ? yn(aiMerged.detectedExpectedIssue)
          : "",
      vibescanDeterministic: "yes",
      vibescanCi: "yes",
      vibescanRegression: "yes",
      aiDeterministic: "no",
      aiCi: "no",
      aiRegression: "manual",
    });
  }

  const toolAxesRows = [
    {
      tool: "vibescan",
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    {
      tool: "eslint-plugin-security",
      explicitCoverage: true,
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    {
      tool: "npm-audit",
      explicitCoverage: "dependencies only",
      stableReruns: true,
      policyGate: true,
      regressionProtection: false,
    },
    {
      tool: "bearer",
      explicitCoverage: "when CLI installed",
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    {
      tool: "snyk",
      explicitCoverage: "when CLI installed",
      stableReruns: true,
      policyGate: true,
      regressionProtection: true,
    },
    {
      tool: "ai-workflow",
      explicitCoverage: false,
      stableReruns: false,
      policyGate: false,
      regressionProtection: "manual",
    },
  ];

  const summaryTable = {
    generatedAtUtc: new Date().toISOString(),
    dateFolder: args.date,
    caseIds,
    rows: aggregateRows,
    toolComparisonAxes: toolAggregate,
    toolAxesRows,
    notes: [
      "Cases are copied from benchmarks/gold-path-demo (synthetic vulnerable/fixed pairs).",
      "VibeScan 'detects expected' uses expected.json / meta.expectedRuleIds.",
      "ESLint column = any security-plugin finding under vulnerable/ (not rule-mapped to VibeScan).",
      "npm audit is one shared run for demo/comparison/package.json.",
      "Bearer/Snyk omitted from PATH → null/empty in 'detects' columns.",
      "Use --check-determinism to verify two VibeScan passes yield identical rule-id sets.",
    ],
  };
  await fs.writeFile(path.join(outRoot, "summary-table.json"), JSON.stringify(summaryTable, null, 2), "utf8");

  const headers = [
    "Case",
    "Title",
    "VibeScan detects expected",
    "ESLint security signal",
    "npm audit (deps)",
    "Bearer",
    "Snyk",
    "AI (manual)",
    "VibeScan deterministic",
    "VibeScan CI",
    "VibeScan regression",
    "AI deterministic",
    "AI CI",
    "AI regression",
  ];
  const lines = [
    headers.map(csvEscape).join(","),
    ...aggregateRows.map((r) =>
      [
        r.case,
        r.title,
        r.vibescan,
        r.eslint,
        r.npmAudit,
        r.bearer,
        r.snyk,
        r.ai,
        r.vibescanDeterministic,
        r.vibescanCi,
        r.vibescanRegression,
        r.aiDeterministic,
        r.aiCi,
        r.aiRegression,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  await fs.writeFile(path.join(outRoot, "summary-table.csv"), lines.join("\n"), "utf8");

  const toolAxisHeaders = [
    "Tool",
    "Explicit coverage",
    "Stable reruns",
    "Policy gate",
    "Regression protection",
  ];
  const toolAxisCsvRows = toolAxesRows.map((r) => [
    r.tool,
    String(r.explicitCoverage),
    String(r.stableReruns),
    String(r.policyGate),
    String(r.regressionProtection),
  ]);
  const toolCsv = [
    toolAxisHeaders.map(csvEscape).join(","),
    ...toolAxisCsvRows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
  await fs.writeFile(path.join(outRoot, "summary-tool-axes.csv"), toolCsv, "utf8");

  console.log(`Wrote results under ${outRoot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
