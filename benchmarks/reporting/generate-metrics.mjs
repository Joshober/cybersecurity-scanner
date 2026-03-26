import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = { runDir: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--run") {
      out.runDir = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
  }
  return out;
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toNumberOrNull(s) {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Very small CSV parser for our controlled inputs (no embedded newlines).
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = splitCsvLine(line);
    const row = {};
    for (let i = 0; i < headers.length; i += 1) row[headers[i]] = cols[i] ?? "";
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function safeDiv(num, den) {
  if (!den) return null;
  return num / den;
}

function pct(x) {
  if (x === null) return "n/a";
  return `${(x * 100).toFixed(1)}%`;
}

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function main() {
  const { runDir } = parseArgs(process.argv);
  if (!runDir) {
    console.error("Usage: node benchmarks/reporting/generate-metrics.mjs --run benchmarks/results/<run-id>");
    process.exit(2);
  }

  const manifestPath = path.join(runDir, "manifest.json");
  const adjudicationPath = path.join(runDir, "adjudication", "adjudication.csv");

  if (!fs.existsSync(manifestPath)) {
    console.error(`Missing manifest: ${manifestPath}`);
    process.exit(2);
  }
  if (!fs.existsSync(adjudicationPath)) {
    console.error(`Missing adjudication CSV: ${adjudicationPath}`);
    process.exit(2);
  }

  const manifest = JSON.parse(readUtf8(manifestPath));
  const rows = parseCsv(readUtf8(adjudicationPath));

  // Schema (controlled):
  // kind: finding|fn
  // tool, file, line, ruleId, adjudicatedLabel
  const byTool = new Map();
  const byToolByRule = new Map();

  function bumpTool(tool, key, n = 1) {
    const cur = byTool.get(tool) ?? { tp: 0, fp: 0, fn: 0, out_of_scope: 0, total: 0 };
    cur[key] += n;
    if (key !== "total") cur.total += n;
    byTool.set(tool, cur);
  }

  function bumpRule(tool, ruleId, key, n = 1) {
    const toolMap = byToolByRule.get(tool) ?? new Map();
    const cur = toolMap.get(ruleId) ?? { tp: 0, fp: 0, out_of_scope: 0, total: 0 };
    cur[key] += n;
    if (key !== "total") cur.total += n;
    toolMap.set(ruleId, cur);
    byToolByRule.set(tool, toolMap);
  }

  for (const r of rows) {
    const kind = (r.kind ?? "").trim();
    const tool = (r.tool ?? "").trim() || "unknown";
    const ruleId = (r.ruleId ?? "").trim() || "unknown";
    const label = (r.adjudicatedLabel ?? "").trim();

    if (kind === "fn") {
      bumpTool(tool, "fn", 1);
      continue;
    }
    if (kind !== "finding") continue;

    if (label === "tp") {
      bumpTool(tool, "tp", 1);
      bumpRule(tool, ruleId, "tp", 1);
    } else if (label === "fp") {
      bumpTool(tool, "fp", 1);
      bumpRule(tool, ruleId, "fp", 1);
    } else if (label === "out_of_scope") {
      bumpTool(tool, "out_of_scope", 1);
      bumpRule(tool, ruleId, "out_of_scope", 1);
    } else {
      // Unknown labels are treated as out-of-scope so they don't silently inflate metrics.
      bumpTool(tool, "out_of_scope", 1);
      bumpRule(tool, ruleId, "out_of_scope", 1);
    }
  }

  const reportsDir = path.join(runDir, "reports");
  ensureDir(reportsDir);

  const runId = path.basename(runDir);
  const versions = manifest.toolVersions ?? {};

  const metricsLines = [];
  metricsLines.push(`# Metrics (from adjudication)`);
  metricsLines.push("");
  metricsLines.push(`**Run:** \`${runId}\``);
  metricsLines.push(`**Benchmark:** \`${manifest.benchmarkSlug ?? "unknown"}\``);
  metricsLines.push("");
  metricsLines.push("## Environment (frozen)");
  metricsLines.push("");
  metricsLines.push(`- Node: \`${versions.node ?? "unknown"}\``);
  metricsLines.push(`- npm: \`${versions.npm ?? "unknown"}\``);
  metricsLines.push(`- VibeScan CLI: \`${versions.vibescanCli ?? versions.secureCodeScanner ?? "unknown"}\``);
  metricsLines.push("");
  metricsLines.push("## Precision / recall (scope-normalized)");
  metricsLines.push("");
  metricsLines.push("| tool | tp | fp | fn | out_of_scope | precision | recall |");
  metricsLines.push("|------|---:|---:|---:|-------------:|----------:|-------:|");

  const tools = Array.from(byTool.keys()).sort();
  for (const tool of tools) {
    const c = byTool.get(tool);
    const precision = safeDiv(c.tp, c.tp + c.fp);
    const recall = safeDiv(c.tp, c.tp + c.fn);
    metricsLines.push(
      `| ${mdEscape(tool)} | ${c.tp} | ${c.fp} | ${c.fn} | ${c.out_of_scope} | ${pct(precision)} | ${pct(recall)} |`
    );
  }
  metricsLines.push("");
  metricsLines.push("**Notes:** out-of-scope findings are excluded from P/R.");
  metricsLines.push("");

  fs.writeFileSync(path.join(reportsDir, "metrics.md"), metricsLines.join("\n"), "utf8");

  const ablationLines = [];
  ablationLines.push("# Rule-level breakdown (from adjudication)");
  ablationLines.push("");
  ablationLines.push(`**Run:** \`${runId}\``);
  ablationLines.push("");

  for (const tool of tools) {
    ablationLines.push(`## ${tool}`);
    ablationLines.push("");
    ablationLines.push("| ruleId | tp | fp | out_of_scope |");
    ablationLines.push("|--------|---:|---:|-------------:|");
    const m = byToolByRule.get(tool) ?? new Map();
    const rules = Array.from(m.keys()).sort();
    for (const ruleId of rules) {
      const c = m.get(ruleId);
      ablationLines.push(`| ${mdEscape(ruleId)} | ${c.tp} | ${c.fp} | ${c.out_of_scope} |`);
    }
    ablationLines.push("");
  }

  fs.writeFileSync(path.join(reportsDir, "ablation.md"), ablationLines.join("\n"), "utf8");

  console.log(`Wrote ${path.join(reportsDir, "metrics.md")}`);
  console.log(`Wrote ${path.join(reportsDir, "ablation.md")}`);
}

main();

