#!/usr/bin/env node
/**
 * Build DVNA benchmark figures from results/dvna-case-catalog.json + results/dvna-detection-matrix.json.
 *
 * Usage:
 *   node benchmarks/scripts/dvna-poster-charts.mjs
 *   node benchmarks/scripts/dvna-poster-charts.mjs --vibescan-json benchmarks/results/.../vibescan-project.json
 *   node benchmarks/scripts/dvna-poster-charts.mjs --proof-coverage-json benchmarks/results/.../vibescan-project.json  # tier bars + table cols (e.g. full-repo scan; defaults to --vibescan-json)
 *   node benchmarks/scripts/dvna-poster-charts.mjs --fill-codeql benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/codeql.sarif
 *
 * Outputs:
 *   results/charts/dvna-detection-rate-poster.html — tool × case heatmap (green/red, optional VibeScan proof ◆)
 *   results/charts/dvna-proof-coverage-poster.html — VibeScan proof tier bar chart
 *   results/charts/dvna-proof-vs-peers-poster.html — same-run table: DVNA case detection vs VibeScan proof tiers (peers N/A)
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

/** Provable locally + generated test file = optional heatmap overlay on VibeScan column */
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

/** Catalog v2: caseOrder; v1: cases array only */
function orderedCases(catalog) {
  const byId = new Map(catalog.cases.map((c) => [c.id, c]));
  if (Array.isArray(catalog.caseOrder)) {
    return catalog.caseOrder.map((id) => {
      const c = byId.get(id);
      if (!c) throw new Error(`Unknown case id in caseOrder: ${id}`);
      return c;
    });
  }
  return [...catalog.cases];
}

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
  const out = { vibescanJson: null, proofCoverageJson: null, fillCodeql: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--vibescan-json" && argv[i + 1]) {
      out.vibescanJson = resolve(repoRoot, argv[++i]);
    } else if (argv[i] === "--proof-coverage-json" && argv[i + 1]) {
      out.proofCoverageJson = resolve(repoRoot, argv[++i]);
    } else if (argv[i] === "--fill-codeql" && argv[i + 1]) {
      out.fillCodeql = resolve(repoRoot, argv[++i]);
    }
  }
  return out;
}

/** Load summary.proofCoverage (or recompute) from a VibeScan project JSON — used for tier bars & table. */
async function loadTierProofSummary(absPath) {
  if (!absPath || !existsSync(absPath)) {
    return { tiers: null, source: null, tiersDerived: false };
  }
  const proj = readJsonFile(absPath);
  let tiers = proj.summary?.proofCoverage || null;
  let tiersDerived = false;
  if (!tiers && Array.isArray(proj.findings)) {
    tiers = await proofCoverageFromFindings(proj.findings);
    tiersDerived = !!tiers;
  }
  return { tiers, source: absPath, tiersDerived };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHeatmapTableBody(cases, tools, codeqlHits, findingsByCase) {
  let prevFamily = null;
  let html = "";
  const colCount = 1 + tools.length;

  for (const c of cases) {
    if (c.family && c.family !== prevFamily) {
      html += `<tr class="family-header"><th scope="colgroup" colspan="${colCount}">${escapeHtml(c.family)}</th></tr>`;
      prevFamily = c.family;
    }

    const title = escapeHtml(c.rowTitle ?? c.chartLabel ?? c.id);
    const sub = (c.rowSubtitle ?? "").trim();
    const subHtml = sub ? `<div class="case-sub">${escapeHtml(sub)}</div>` : "";

    html += `<tr><th scope="row" class="case-cell"><div class="case-title">${title}</div>${subHtml}</th>`;

    for (const t of tools) {
      let hitMap = { ...t.detections };
      if (t.id === "codeql" && codeqlHits) hitMap = { ...hitMap, ...codeqlHits };
      const hit = hitMap[c.id] === true;
      const showProof =
        t.id === "vibescan" && findingsByCase.size > 0 && proofMarkerForCase(c.id, findingsByCase);
      const proofSpan = showProof
        ? ` <span class="proof-mark" title="Deterministic local proof artifact (provable_locally + wasGenerated)">◆</span>`
        : "";
      const label = hit ? "Detected" : "Missed";
      html += `<td class="${hit ? "hit" : "miss"}" data-hit="${hit}" title="${label}">${label}${proofSpan}</td>`;
    }
    html += "</tr>";
  }
  return html;
}

async function main() {
  const args = parseArgs(process.argv);
  const catalog = JSON.parse(readFileSync(catalogPath, "utf-8"));
  const matrix = JSON.parse(readFileSync(matrixPath, "utf-8"));
  validateDetectionMatrix(catalog, matrix);
  const cases = orderedCases(catalog);

  let codeqlHits = null;
  if (args.fillCodeql && existsSync(args.fillCodeql)) {
    codeqlHits = parseCodeqlCaseHits(args.fillCodeql, catalog.cases);
  }

  /** @type {Map<string, object[]>} */
  const findingsByCase = new Map();
  if (args.vibescanJson && existsSync(args.vibescanJson)) {
    const proj = readJsonFile(args.vibescanJson);
    const findings = proj.findings || [];
    for (const f of findings) {
      const cid = caseIdForFinding(f, catalog.cases);
      if (!cid) continue;
      if (!findingsByCase.has(cid)) findingsByCase.set(cid, []);
      findingsByCase.get(cid).push(f);
    }
  }

  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const theadTools = tools.map((t) => `<th scope="col" class="tool-col">${escapeHtml(t.label)}</th>`).join("\n");
  const tbody = buildHeatmapTableBody(cases, tools, codeqlHits, findingsByCase);

  const tierJsonPath =
    args.proofCoverageJson && existsSync(args.proofCoverageJson)
      ? args.proofCoverageJson
      : args.vibescanJson && existsSync(args.vibescanJson)
        ? args.vibescanJson
        : null;
  const tierProofSummary = await loadTierProofSummary(tierJsonPath);

  const dualTierSourceNote =
    args.proofCoverageJson &&
    existsSync(args.proofCoverageJson) &&
    args.vibescanJson &&
    existsSync(args.vibescanJson) &&
    args.proofCoverageJson !== args.vibescanJson
      ? `<p class="scope"><strong>Note:</strong> Tier bars and the VibeScan row below use <code>summary.proofCoverage</code> from the <strong>proof-coverage</strong> run (every finding in that scan — e.g. full repo or merged scope, not only rows that match the eleven DVNA heatmap cases). Heatmap ◆ markers still use <code>--vibescan-json</code> for DVNA anchor alignment.</p>`
      : "";

  mkdirSync(outDir, { recursive: true });

  const vibescanJsonNote = args.vibescanJson && existsSync(args.vibescanJson)
    ? `<p class="scope"><strong>VibeScan run JSON:</strong> ${escapeHtml(args.vibescanJson)}</p>`
    : "";

  const heatmapHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DVNA — detection heatmap (tools × cases)</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.25rem; color: #0d1b2a; }
    .scope { max-width: 960px; font-size: 0.85rem; color: #475569; margin-bottom: 16px; line-height: 1.5; }
    .table-wrap { max-width: 1200px; overflow-x: auto; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    table.heatmap { border-collapse: collapse; width: 100%; font-size: 0.8rem; }
    .heatmap th, .heatmap td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: middle; text-align: center; }
    .heatmap th.scope.row { text-align: left; }
    .family-header th { background: #e2e8f0; color: #0f172a; font-weight: 700; text-align: left; font-size: 0.85rem; }
    .case-cell { background: #f8fafc; text-align: left !important; min-width: 200px; }
    .case-title { font-weight: 600; color: #0f172a; }
    .case-sub { font-size: 0.75rem; color: #64748b; margin-top: 4px; font-weight: 400; }
    .tool-col { background: #f1f5f9; font-weight: 600; }
    td.hit { background: #22c55e; color: #fff; font-weight: 600; }
    td.miss { background: #ef4444; color: #fff; font-weight: 600; }
    .proof-mark { margin-left: 4px; font-size: 0.95rem; color: #fef08a; text-shadow: 0 0 1px #0f172a; }
    .legend { margin-top: 16px; font-size: 0.8rem; color: #334155; max-width: 960px; }
    .legend-interpret { margin-top: 20px; font-size: 0.8rem; color: #475569; max-width: 960px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>DVNA detection heatmap</h1>
  <p class="scope">${escapeHtml(matrix.scopeNote)}</p>
  <p class="scope"><strong>Metric:</strong> ${escapeHtml(matrix.metricDefinition)}</p>
  <p class="scope"><strong>Data:</strong> ${escapeHtml(matrix.source)}</p>
  ${vibescanJsonNote}
  <p class="scope">How to read this chart: rows group cases by <strong>family</strong>; subtitles distinguish scenarios (e.g. three NoSQL Injection contexts). Columns are static-analysis tools (excludes npm audit–style dependency-only scope). See <code>results/dvna-benchmark-interpretation.md</code> for fair comparison framing.</p>
  <div class="table-wrap">
    <table class="heatmap">
      <thead>
        <tr>
          <th scope="col" class="case-cell">Case</th>
          ${theadTools}
        </tr>
      </thead>
      <tbody>
        ${tbody}
      </tbody>
    </table>
  </div>
  <p class="legend"><strong>Legend:</strong> green = detected for this row’s anchors in <code>results/dvna-case-catalog.json</code>; red = missed. ◆ on <strong>VibeScan</strong> = deterministic local proof artifact when a project JSON was passed to the generator.</p>
  <p class="legend-interpret">Gaps mean “not covered in this evaluated configuration and scope,” not necessarily that a tool can never find this class. npm audit is advisory scope; Semgrep/CodeQL depend on rule packs; route/auth/session contexts need framework modeling; most peers target detection rather than deterministic proofs.</p>
</body>
</html>`;

  writeFileSync(join(outDir, "dvna-detection-rate-poster.html"), heatmapHtml, "utf-8");

  const proofBars =
    tierProofSummary.tiers && typeof tierProofSummary.tiers === "object"
      ? extractProofBars(tierProofSummary.tiers)
      : null;

  const htmlProof = buildProofHtml(tierProofSummary, proofBars, {
    matrix,
    tools,
    cases,
    codeqlHits,
    dualTierSourceNote,
  });
  writeFileSync(join(outDir, "dvna-proof-coverage-poster.html"), htmlProof, "utf-8");

  const htmlVsPeers = buildProofVsPeersHtml(matrix, tools, cases, tierProofSummary, codeqlHits);
  writeFileSync(join(outDir, "dvna-proof-vs-peers-poster.html"), htmlVsPeers, "utf-8");

  console.log(`Wrote ${join(outDir, "dvna-detection-rate-poster.html")} (heatmap)`);
  console.log(`Wrote ${join(outDir, "dvna-proof-coverage-poster.html")}`);
  console.log(`Wrote ${join(outDir, "dvna-proof-vs-peers-poster.html")} (detection vs proof tiers)`);
  if (codeqlHits) {
    console.log("CodeQL case hits (heuristic from SARIF):", codeqlHits);
  }
}

function caseIdsFromCatalog(cases) {
  return cases.map((c) => c.id);
}

function caseHitsForTool(tool, caseIds, codeqlHits) {
  let hitMap = { ...tool.detections };
  if (tool.id === "codeql" && codeqlHits) hitMap = { ...hitMap, ...codeqlHits };
  const n = caseIds.filter((id) => hitMap[id] === true).length;
  return { hits: n, of: caseIds.length };
}

function buildCompareTableRows(tools, caseIds, codeqlHits, tierProofSummary) {
  const tiers = tierProofSummary.tiers && typeof tierProofSummary.tiers === "object" ? tierProofSummary.tiers : null;
  const vsHasProof =
    tiers && typeof tiers.provable === "number" && typeof tiers.total_findings === "number";

  return tools
    .map((t) => {
      const { hits, of } = caseHitsForTool(t, caseIds, codeqlHits);
      const isVs = t.id === "vibescan";
      const pct = of > 0 ? Math.round((hits / of) * 1000) / 10 : 0;
      const detCell = `${hits}/${of} <span class="muted">(${pct}%)</span>`;
      let t1 = "—";
      let t2 = "—";
      let t3 = "—";
      let t4 = "—";
      let nFind = "—";
      let tierTitleAttr = "";
      if (isVs && vsHasProof) {
        t1 = String(tiers.provable);
        t2 = String(tiers.partial);
        t3 = String(tiers.structural);
        t4 = String(tiers.detection_only);
        nFind = String(tiers.total_findings);
        const tf = tiers.total_findings;
        tierTitleAttr = ` title="${escapeHtml(
          `Full DVNA tree scan: ${tf} finding row(s) in this JSON; tiers sum to that total. “11/11” in the prior column is only benchmark anchor coverage (n=11 heatmap rows), not a cap on findings or proof tests.`
        )}"`;
      } else if (!isVs && typeof t.dvnaRunIssueCount === "number") {
        const n = t.dvnaRunIssueCount;
        t1 = "0";
        t2 = "0";
        t3 = "0";
        t4 = String(n);
        nFind = String(n);
        const note = t.dvnaRunIssueCountNote ? escapeHtml(t.dvnaRunIssueCountNote) : "";
        tierTitleAttr = ` title="Peer normalization: tiers 1–3 = 0; tier 4 = all issue rows in frozen DVNA run (${n}). Not VibeScan proofGenerator output.${note ? " " + note : ""}"`;
      }
      const rowClass = isVs ? ' class="row-vibescan"' : "";
      const findTitle =
        isVs && vsHasProof
          ? ` title="${escapeHtml("Matches summary.proofCoverage.total_findings (entire scan in this JSON).")}"`
          : "";
      return `<tr${rowClass}>
  <th scope="row">${escapeHtml(t.label)}${t.highlight ? ' <span class="badge">heatmap focus</span>' : ""}</th>
  <td>${escapeHtml(t.role || "sast")}</td>
  <td class="num">${detCell}</td>
  <td class="num"${tierTitleAttr}>${t1}</td>
  <td class="num"${tierTitleAttr}>${t2}</td>
  <td class="num"${tierTitleAttr}>${t3}</td>
  <td class="num"${tierTitleAttr}>${t4}</td>
  <td class="num"${findTitle}>${nFind}</td>
</tr>`;
    })
    .join("\n");
}

/** Shared fragment: peer detection vs VibeScan tier columns (used in proof-coverage poster and standalone vs-peers poster). */
function buildCompareSectionHtml(matrix, tools, cases, tierProofSummary, codeqlHits) {
  const caseIds = caseIdsFromCatalog(cases);
  const rows = buildCompareTableRows(tools, caseIds, codeqlHits, tierProofSummary);

  return `<h2 class="section-title">DVNA benchmark grid vs proof tiers (full scan)</h2>
  <p class="scope"><strong>Rows hit (11):</strong> Counts <strong>line-anchored benchmark scenarios</strong> in <code>results/dvna-case-catalog.json</code> — the same eleven heatmap rows. That number is <em>not</em> how many findings VibeScan reported: the scanner runs on the whole DVNA tree; use <strong>Findings</strong> and the tier columns for full output. <strong>VibeScan</strong> tiers come from <code>summary.proofCoverage</code> (every finding in the JSON). <strong>Peers</strong> have no equivalent schema; <code>dvnaRunIssueCount</code> is charted as 0/0/0/<em>N</em> for shape. Larger <em>N</em> is not “ahead” of VibeScan — different rules, deduping, and noise; see <code>results/dvna-benchmark-interpretation.md</code>.</p>
  <p class="scope"><strong>Detection matrix:</strong> ${escapeHtml(matrix.source || matrix.metric || "results/dvna-detection-matrix.json")}</p>
  <div class="table-wrap">
    <table class="compare">
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col">Role</th>
          <th scope="col" title="Benchmark anchors only: how many of the eleven catalog rows this tool hit (heatmap metric). Not total findings.">Rows hit<br/><span class="muted">DVNA grid (11)</span></th>
          <th scope="col" title="VibeScan tier 1">Tier 1<br/><span class="muted">provable</span></th>
          <th scope="col">Tier 2<br/><span class="muted">partial</span></th>
          <th scope="col">Tier 3<br/><span class="muted">structural</span></th>
          <th scope="col">Tier 4<br/><span class="muted">detect only</span></th>
          <th scope="col" title="VibeScan: total_findings in proof JSON (full scan). Peers: frozen run issue count — table normalization places peers in tier 4.">Findings<br/><span class="muted">(full DVNA run)</span></th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  <p class="footnote"><strong>Peer tier rows:</strong> Values are a <em>display normalization</em> for charting (all tool-reported issues stacked in tier 4), not an native product metric. VibeScan tiers 1–4 are structurally meaningful for local proof. See <code>results/dvna-benchmark-interpretation.md</code> and <code>dvnaRunIssueCount</code> in the matrix.</p>`;
}

/**
 * Standalone table-only poster (same compare block as embedded in proof-coverage poster).
 */
function buildProofVsPeersHtml(matrix, tools, cases, tierProofSummary, codeqlHits) {
  const proofSource = tierProofSummary.source
    ? `<p class="scope"><strong>VibeScan proof / tier source:</strong> ${escapeHtml(tierProofSummary.source)}</p>`
    : `<p class="scope"><strong>VibeScan proof / tier source:</strong> none — pass <code>--vibescan-json</code> or <code>--proof-coverage-json</code> with a project JSON from <code>scan --generate-tests</code> to populate tier columns.</p>`;

  const compareInner = buildCompareSectionHtml(matrix, tools, cases, tierProofSummary, codeqlHits);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DVNA — detection vs proof tiers (VibeScan vs peers)</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.25rem; color: #0d1b2a; }
    .section-title { font-size: 1rem; color: #334155; margin: 28px 0 12px; font-weight: 600; }
    .scope { max-width: 980px; font-size: 0.85rem; color: #475569; margin-bottom: 14px; line-height: 1.55; }
    .table-wrap { max-width: 1100px; overflow-x: auto; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    table.compare { border-collapse: collapse; width: 100%; font-size: 0.82rem; }
    .compare th, .compare td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: middle; }
    .compare thead th { background: #f1f5f9; font-weight: 600; text-align: left; }
    .compare tbody th { text-align: left; font-weight: 600; background: #fafafa; }
    .compare td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .compare tr.row-vibescan th, .compare tr.row-vibescan td { background: #ecfdf5; }
    .muted { color: #64748b; font-weight: 400; }
    .badge { font-size: 0.7rem; font-weight: 600; color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 4px; }
    .footnote { margin-top: 18px; font-size: 0.8rem; color: #475569; max-width: 980px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    code { font-size: 0.88em; }
  </style>
</head>
<body>
  <h1>DVNA — case detection vs proof tiers (cross-product)</h1>
  <p class="scope">Standalone table: <strong>11/11-style column</strong> = benchmark grid only (heatmap anchors). <strong>Tier + Findings</strong> columns for VibeScan = full scan in the project JSON — not limited to eleven rows. For tier bars + this table together, open <code>dvna-proof-coverage-poster.html</code>.</p>
  ${proofSource}
  ${compareInner}
</body>
</html>`;
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

const PROOF_TIER_BAR_COLORS = ["#22c55e", "#84cc16", "#eab308", "#94a3b8"];

/** CSS horizontal bars only — no Chart.js CDN (offline/file:// safe, readable long labels). */
function proofTierBarsHtml(rows) {
  if (!rows.length) {
    return "<p class=\"scope\">No tier summary in this JSON. Run <code>cd vibescan &amp;&amp; npm run build</code> and regenerate, or ensure <code>summary.proofCoverage</code> / findings are present.</p>";
  }
  const maxVal = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const bars = rows
    .map((r, i) => {
      const pct = maxVal > 0 ? Math.round((r.value / maxVal) * 1000) / 10 : 0;
      const color = PROOF_TIER_BAR_COLORS[i] ?? "#64748b";
      return `<div class="tier-row">
  <div class="tier-label">${escapeHtml(r.label)}</div>
  <div class="tier-track" title="${r.value} finding(s)">
    <div class="tier-fill" style="width: ${pct}%; background: ${color};"></div>
  </div>
  <div class="tier-num">${r.value}</div>
</div>`;
    })
    .join("\n");
  return `<p class="tier-summary">Total findings counted: <strong>${total}</strong> (sum of tier buckets)</p>
<div class="tier-bars" role="list" aria-label="VibeScan proof tier counts">${bars}</div>`;
}

function buildProofHtml(tierProofSummary, proofBars, ctx) {
  const { matrix, tools, cases, codeqlHits, dualTierSourceNote } = ctx;
  const rows = proofBars || [];
  const hasData = rows.length > 0;
  const val = (sub) => rows.find((x) => x.label.includes(sub))?.value ?? 0;
  const onlyDetection =
    hasData &&
    val("tier 1") === 0 &&
    val("tier 2") === 0 &&
    val("tier 3") === 0 &&
    val("tier 4") > 0;
  const tiersMeta = tierProofSummary.tiers && typeof tierProofSummary.tiers === "object" ? tierProofSummary.tiers : null;
  const pipelineNote =
    tiersMeta?.proof_pipeline_not_run === true
      ? "<p class=\"scope\"><strong>Note:</strong> <code>proof_pipeline_not_run</code> — no finding in this run carried a <code>proofGeneration</code> block (typical for <code>scan</code> without <code>--generate-tests</code>). Tiers still classify expected proof <em>actionability</em>; counts are not from executed proof files.</p>"
      : "";
  const derivedNote = tierProofSummary.tiersDerived
    ? "<p class=\"scope\"><strong>Note:</strong> Tiers recomputed from <code>findings[]</code> via <code>summarizeProofCoverage</code> (source JSON lacked <code>summary.proofCoverage</code>).</p>"
    : "";
  const dvnaNote = onlyDetection
    ? "<p class=\"scope\">Many rules surface as <strong>tier 4 (detection only)</strong> until a proof-oriented generator exists for that pattern; this is distinct from cross-tool <em>detection</em> rate.</p>"
    : "";
  const chartBody = hasData ? proofTierBarsHtml(rows) : proofTierBarsHtml([]);
  const compareSection = buildCompareSectionHtml(matrix, tools, cases, tierProofSummary, codeqlHits);
  const wideJsonHint = `<p class="scope">Use <code>--proof-coverage-json path/to/vibescan-project.json</code> to drive the bar chart and tier columns from a scan of <strong>any tree</strong> (e.g. whole monorepo with <code>--generate-tests</code>). If omitted, the chart uses the same JSON as <code>--vibescan-json</code> (often the DVNA app only). Counts always reflect <em>every</em> finding in that file, not a subset of the eleven heatmap rows.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DVNA — VibeScan proof tiers &amp; cross-tool comparison</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.25rem; color: #0d1b2a; }
    .section-title { font-size: 1rem; color: #334155; margin: 28px 0 12px; font-weight: 600; }
    .scope { max-width: 980px; font-size: 0.85rem; color: #475569; margin-bottom: 16px; line-height: 1.5; }
    .chart-wrap { max-width: 820px; background: #fff; padding: 20px 20px 24px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    .chart-wrap h2 { font-size: 1rem; margin: 0 0 16px; color: #334155; font-weight: 600; }
    .tier-summary { margin: 0 0 14px; font-size: 0.9rem; color: #475569; }
    .tier-bars { display: flex; flex-direction: column; gap: 12px; }
    .tier-row { display: grid; grid-template-columns: minmax(200px, 1.1fr) 3fr auto; gap: 10px 14px; align-items: center; font-size: 0.82rem; }
    .tier-label { color: #0f172a; line-height: 1.35; }
    .tier-track { height: 22px; background: #e2e8f0; border-radius: 6px; overflow: hidden; min-width: 0; }
    .tier-fill { height: 100%; border-radius: 6px; min-width: 0; transition: width 0.2s ease; }
    .tier-num { font-weight: 700; font-variant-numeric: tabular-nums; color: #0f172a; min-width: 2.25rem; text-align: right; }
    .table-wrap { max-width: 1100px; overflow-x: auto; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    table.compare { border-collapse: collapse; width: 100%; font-size: 0.82rem; }
    .compare th, .compare td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: middle; }
    .compare thead th { background: #f1f5f9; font-weight: 600; text-align: left; }
    .compare tbody th { text-align: left; font-weight: 600; background: #fafafa; }
    .compare td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .compare tr.row-vibescan th, .compare tr.row-vibescan td { background: #ecfdf5; }
    .muted { color: #64748b; font-weight: 400; }
    .badge { font-size: 0.7rem; font-weight: 600; color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 4px; }
    .footnote { margin-top: 18px; font-size: 0.8rem; color: #475569; max-width: 980px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    code { font-size: 0.88em; }
  </style>
</head>
<body>
  <h1>VibeScan proof tiers &amp; DVNA cross-tool comparison</h1>
  <p class="scope"><strong>Actionability</strong> (proof tiers below) is separate from the heatmap’s <strong>eleven benchmark rows</strong>. Tier counts come from <code>summary.proofCoverage</code> for <em>every</em> finding in the chosen JSON — e.g. 25 means 25 finding rows on the scanned DVNA tree, not “11”. The comparison table’s “11/11” column is only how many catalog anchors were hit.</p>
  ${wideJsonHint}
  ${dualTierSourceNote || ""}
  ${tierProofSummary.source ? `<p class="scope"><strong>Proof tier source JSON:</strong> ${escapeHtml(tierProofSummary.source)}</p>` : ""}
  ${pipelineNote}
  ${derivedNote}
  ${dvnaNote}
  <div class="chart-wrap">
    <h2>VibeScan proof tier distribution</h2>
    ${chartBody}
  </div>
  ${compareSection}
</body>
</html>`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
