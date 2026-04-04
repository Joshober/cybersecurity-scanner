#!/usr/bin/env node
/**
 * Build poster-style HTML charts from results/dvna-case-catalog.json + results/dvna-detection-matrix.json.
 *
 * Usage:
 *   node benchmarks/scripts/dvna-poster-charts.mjs
 *   node benchmarks/scripts/dvna-poster-charts.mjs --vibescan-json benchmarks/results/.../vibescan-project.json
 *   node benchmarks/scripts/dvna-poster-charts.mjs --fill-codeql benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/codeql.sarif
 *
 * Outputs: results/charts/dvna-detection-rate-poster.html, dvna-proof-coverage-poster.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const catalogPath = join(repoRoot, "results", "dvna-case-catalog.json");
const matrixPath = join(repoRoot, "results", "dvna-detection-matrix.json");
const outDir = join(repoRoot, "results", "charts");

function normRel(p) {
  if (!p) return "";
  return String(p).replace(/\\/g, "/").toLowerCase();
}

function findingMatchesCase(finding, c) {
  const fp = normRel(finding.filePath || finding.file || "");
  const suf = normRel(c.anchorSuffix);
  if (!fp.endsWith(suf)) return false;
  const line = Number(finding.line);
  return c.anchorLines.some((L) => L === line);
}

function caseIdForFinding(finding, cases) {
  for (const c of cases) {
    if (findingMatchesCase(finding, c)) return c.id;
  }
  return null;
}

/** Heuristic: provable locally + generated test file = poster proof marker */
function proofMarkerForCase(caseId, findingsByCase) {
  const rows = findingsByCase.get(caseId) || [];
  for (const f of rows) {
    const pg = f.proofGeneration;
    if (!pg) continue;
    if (pg.status === "provable_locally" && pg.wasGenerated && pg.generatedPath) return true;
  }
  return false;
}

function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text.replace(/^\u00ef\u00bb\u00bf/, "");
}

/** Handles UTF-8, UTF-8 BOM, and UTF-16 LE (Windows redirent). */
function readJsonFile(absPath) {
  const buf = readFileSync(absPath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return JSON.parse(buf.subarray(2).toString("utf16le"));
  }
  return JSON.parse(stripBom(buf.toString("utf-8")));
}

function parseCodeqlCaseHits(sarifPath, cases) {
  const doc = readJsonFile(sarifPath);
  const run = doc.runs?.[0];
  const results = Array.isArray(run?.results) ? run.results : [];
  const hits = Object.fromEntries(cases.map((c) => [c.id, false]));
  for (const raw of results) {
    const locs = raw.locations;
    if (!Array.isArray(locs) || !locs[0]) continue;
    const pl = locs[0].physicalLocation;
    const uri = pl?.artifactLocation?.uri || "";
    const line = pl?.region?.startLine ?? 1;
    const pseudo = { filePath: uri, line };
    const cid = caseIdForFinding(pseudo, cases);
    if (cid) hits[cid] = true;
  }
  return hits;
}

function validateDetectionMatrix(catalog, matrix) {
  const ids = catalog.cases.map((c) => c.id);
  const issues = [];
  for (const t of matrix.tools) {
    if (t.chartMode === "gap") continue;
    for (const id of ids) {
      const v = t.detections[id];
      if (v !== true && v !== false) {
        issues.push(`${t.label} (${t.id}): ${id} = ${JSON.stringify(v)} (expected true or false)`);
      }
    }
  }
  if (issues.length) {
    console.error("Detection matrix incomplete — fix results/dvna-detection-matrix.json:\n" + issues.join("\n"));
    process.exit(1);
  }
  console.log("OK: detection matrix has full true/false coverage for all charted SAST tools × cases.");
}

/** When summary.proofCoverage is missing (legacy JSON), recompute via packaged evidence helpers. */
async function proofCoverageFromFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) return null;
  try {
    const evUrl = pathToFileURL(join(repoRoot, "vibescan", "dist", "system", "evidence.js")).href;
    const { summarizeProofCoverage } = await import(evUrl);
    return summarizeProofCoverage(findings);
  } catch (e) {
    console.error("Could not import vibescan evidence.js (run: cd vibescan && npm run build):", e);
    return null;
  }
}

function parseArgs(argv) {
  const out = { vibescanJson: null, fillCodeql: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--vibescan-json" && argv[i + 1]) {
      out.vibescanJson = resolve(repoRoot, argv[++i]);
    } else if (argv[i] === "--fill-codeql" && argv[i + 1]) {
      out.fillCodeql = resolve(repoRoot, argv[++i]);
    }
  }
  return out;
}

/** One distinct color per tool id so lines do not blend on the poster chart. */
const TOOL_LINE_COLORS = {
  vibescan: "rgb(34, 197, 94)",
  bearer: "rgb(59, 130, 246)",
  "snyk-code": "rgb(168, 85, 247)",
  semgrep: "rgb(234, 88, 12)",
  codeql: "rgb(219, 39, 119)",
  "eslint-security": "rgb(13, 148, 136)",
};

function lineColorForTool(toolId, idx) {
  if (TOOL_LINE_COLORS[toolId]) return TOOL_LINE_COLORS[toolId];
  const seed = String(toolId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (idx * 53 + seed) % 360;
  return `hsl(${hue} 62% 44%)`;
}

async function main() {
  const args = parseArgs(process.argv);
  const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
  const matrix = JSON.parse(readFileSync(matrixPath, "utf-8"));
  validateDetectionMatrix(catalog, matrix);
  const cases = catalog.cases;

  let codeqlHits = null;
  if (args.fillCodeql && existsSync(args.fillCodeql)) {
    codeqlHits = parseCodeqlCaseHits(args.fillCodeql, cases);
  }

  const labelsWithN = cases.map((c) => `${c.chartLabel} (n=${c.n})`);

  /** @type {Map<string, object[]>} */
  const findingsByCase = new Map();
  if (args.vibescanJson && existsSync(args.vibescanJson)) {
    const proj = readJsonFile(args.vibescanJson);
    const findings = proj.findings || [];
    for (const f of findings) {
      const cid = caseIdForFinding(f, cases);
      if (!cid) continue;
      if (!findingsByCase.has(cid)) findingsByCase.set(cid, []);
      findingsByCase.get(cid).push(f);
    }
  }

  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");

  const datasets = tools.map((t, idx) => {
    let hitMap = { ...t.detections };
    if (t.id === "codeql" && codeqlHits) {
      hitMap = { ...hitMap, ...codeqlHits };
    }
    const data = cases.map((c) => {
      const v = hitMap[c.id];
      if (v === null || v === undefined) return null;
      return v ? 100 : 0;
    });
    const isHighlight = t.highlight === true;
    const color = lineColorForTool(t.id, idx);
    const borderWidth = isHighlight ? 4 : 2;
    const pointRadius = cases.map((c) => {
      if (!isHighlight) return 3;
      const hasProof =
        findingsByCase.size > 0
          ? proofMarkerForCase(c.id, findingsByCase)
          : false;
      return hasProof ? 10 : 4;
    });
    return {
      label: t.label,
      data,
      borderColor: color,
      backgroundColor: "transparent",
      borderWidth,
      tension: 0.25,
      spanGaps: false,
      pointRadius,
      pointBorderColor: isHighlight
        ? cases.map((c) =>
            findingsByCase.size > 0 && proofMarkerForCase(c.id, findingsByCase)
              ? "rgba(13, 27, 42, 1)"
              : color
          )
        : color,
      pointBackgroundColor: isHighlight
        ? cases.map((c) =>
            findingsByCase.size > 0 && proofMarkerForCase(c.id, findingsByCase)
              ? "rgba(255, 255, 255, 0.95)"
              : color
          )
        : color,
    };
  });

  const proofSummary = { tiers: null, source: null, tiersDerived: false };
  if (args.vibescanJson && existsSync(args.vibescanJson)) {
    const proj = readJsonFile(args.vibescanJson);
    proofSummary.source = args.vibescanJson;
    proofSummary.tiers = proj.summary?.proofCoverage || null;
    proofSummary.byFamily = proj.summary?.proofCoverageByRuleFamily || null;
    if (!proofSummary.tiers && Array.isArray(proj.findings)) {
      proofSummary.tiers = await proofCoverageFromFindings(proj.findings);
      proofSummary.tiersDerived = !!proofSummary.tiers;
    }
  }

  mkdirSync(outDir, { recursive: true });

  const htmlDetection = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DVNA — detection rate by case family</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.25rem; color: #0d1b2a; }
    .scope { max-width: 960px; font-size: 0.85rem; color: #475569; margin-bottom: 16px; line-height: 1.5; }
    .chart-wrap { max-width: 1100px; background: #fff; padding: 16px 16px 8px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    canvas { max-height: 520px; }
    .legend-proof { font-size: 0.8rem; color: #334155; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>Detection rate by DVNA case family (ground-truth rows, n=1 each)</h1>
  <p class="scope">${escapeHtml(matrix.scopeNote)}</p>
  <p class="scope"><strong>Metric:</strong> ${escapeHtml(matrix.metricDefinition)}</p>
  <p class="scope"><strong>Data:</strong> ${escapeHtml(matrix.source)}</p>
  <div class="chart-wrap">
    <canvas id="c"></canvas>
    <p class="legend-proof">Larger / diamond markers on <strong>VibeScan</strong> indicate a generated deterministic proof artifact (<code>proofGeneration.wasGenerated</code> + <code>provable_locally</code>) when a VibeScan JSON path was passed to the generator.</p>
  </div>
  <script>
    const labels = ${JSON.stringify(labelsWithN)};
    const datasets = ${JSON.stringify(datasets)};
    const ctx = document.getElementById('c').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: { display: true, text: 'TP / (TP + FN) proxy: 100% if case detected, 0% if missed (per family)' },
          legend: { position: 'bottom' },
        },
        scales: {
          y: { min: 0, max: 100, title: { display: true, text: 'Detection rate (%)' } },
          x: { ticks: { maxRotation: 55, minRotation: 35 } },
        },
      },
    });
  </script>
</body>
</html>`;

  writeFileSync(join(outDir, "dvna-detection-rate-poster.html"), htmlDetection, "utf-8");

  const proofBars =
    proofSummary.tiers && typeof proofSummary.tiers === "object"
      ? extractProofBars(proofSummary.tiers)
      : null;

  const htmlProof = buildProofHtml(proofSummary, proofBars);
  writeFileSync(join(outDir, "dvna-proof-coverage-poster.html"), htmlProof, "utf-8");

  console.log(`Wrote ${join(outDir, "dvna-detection-rate-poster.html")}`);
  console.log(`Wrote ${join(outDir, "dvna-proof-coverage-poster.html")}`);
  if (codeqlHits) {
    console.log("CodeQL case hits (heuristic from SARIF):", codeqlHits);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractProofBars(pc) {
  const out = [];
  if (typeof pc.provable === "number") out.push({ label: "Provable locally (tier 1)", value: pc.provable });
  if (typeof pc.partial === "number") out.push({ label: "Partial proof (tier 2)", value: pc.partial });
  if (typeof pc.structural === "number") out.push({ label: "Structural (tier 3)", value: pc.structural });
  if (typeof pc.detection_only === "number")
    out.push({ label: "Detection only (tier 4)", value: pc.detection_only });
  return out.length ? out : null;
}

function buildProofHtml(proofSummary, proofBars) {
  const rows = proofBars || [];
  const hasData = rows.length > 0;
  const val = (sub) => rows.find((x) => x.label.includes(sub))?.value ?? 0;
  const onlyDetection =
    hasData &&
    val("tier 1") === 0 &&
    val("tier 2") === 0 &&
    val("tier 3") === 0 &&
    val("tier 4") > 0;
  const payload = JSON.stringify(
    hasData
      ? {
          labels: rows.map((x) => x.label),
          data: rows.map((x) => x.value),
        }
      : {
          labels: ["(no findings or could not load vibescan/dist/system/evidence.js)"],
          data: [0],
        }
  );
  const derivedNote = proofSummary.tiersDerived
    ? "<p class=\"scope\"><strong>Note:</strong> Tiers recomputed from <code>findings[]</code> via <code>summarizeProofCoverage</code> (legacy JSON lacked <code>summary.proofCoverage</code>).</p>"
    : "";
  const dvnaNote = onlyDetection
    ? "<p class=\"scope\">On DVNA, many rules surface as <strong>tier 4 (detection only)</strong> until a proof-oriented generator exists for that pattern; this is expected and distinct from cross-tool <em>detection</em> rate.</p>"
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VibeScan — proof tier counts (DVNA)</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.25rem; color: #0d1b2a; }
    .scope { max-width: 720px; font-size: 0.85rem; color: #475569; margin-bottom: 16px; line-height: 1.5; }
    .chart-wrap { max-width: 800px; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
  </style>
</head>
<body>
  <h1>Proof coverage (VibeScan only) — tier bucket counts</h1>
  <p class="scope">Companion to detection-rate chart: actionability differs from raw detection. Uses <code>summary.proofCoverage</code> when present, otherwise recomputes from findings.</p>
  ${proofSummary.source ? `<p class="scope"><strong>Source JSON:</strong> ${escapeHtml(proofSummary.source)}</p>` : ""}
  ${derivedNote}
  ${dvnaNote}
  <div class="chart-wrap"><canvas id="p"></canvas></div>
  <script>
    const P = ${payload};
    const ctx = document.getElementById('p').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: P.labels,
        datasets: [{
          label: 'Findings in tier',
          data: P.data,
          backgroundColor: ['#22c55e','#84cc16','#eab308','#94a3b8'],
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: 'VibeScan proof tiers on benchmark corpus' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  </script>
</body>
</html>`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
