#!/usr/bin/env node
/**
 * Generate the CCSC data-science poster as a single self-contained HTML file
 * with 4 inline SVG charts, plus standalone chart files under results/charts/.
 *
 * Usage:  node benchmarks/scripts/generate-research-poster-charts.mjs
 * Output: docs/vibescan/vibescan-research-poster.html  (main poster)
 *         results/charts/vibescan-dvna-recall-bar-chart.html
 *         results/charts/vibescan-recall-vs-volume-scatter.html
 *         results/charts/vibescan-coverage-gap-chart.html
 *         results/charts/vibescan-dvna-heatmap-mini.html
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const chartsDir = join(repoRoot, "results", "charts");
const posterPath = join(repoRoot, "docs", "vibescan", "vibescan-research-poster.html");

function readJson(relPath) {
  return JSON.parse(readFileSync(join(repoRoot, relPath), "utf8"));
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function txt(x, y, text, extra = "") {
  return `<text x="${x}" y="${y}" ${extra}>${esc(text)}</text>`;
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadCompareRows(matrix) {
  return matrix.tools
    .filter((t) => t.chartMode !== "gap")
    .map((tool) => {
      const vals = Object.values(tool.detections || {});
      const hits = vals.filter((v) => v === true).length;
      const total = vals.length;
      return {
        id: tool.id,
        label: tool.label,
        hits,
        total,
        percent: total > 0 ? (hits / total) * 100 : 0,
        rawIssues: Number(tool.dvnaRunIssueCount || 0),
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

// ---------------------------------------------------------------------------
// Chart 1: DVNA Recall horizontal bar chart
// ---------------------------------------------------------------------------

function buildRecallBarSvg(rows, opts = {}) {
  const { width = 480, title = "DVNA Recall by Tool" } = opts;
  const margin = { top: 36, right: 100, bottom: 28, left: 150 };
  const chartW = width - margin.left - margin.right;
  const rowH = 32;
  const innerH = rows.length * rowH;
  const svgH = margin.top + innerH + margin.bottom;

  const bars = rows
    .map((row, idx) => {
      const y = margin.top + idx * rowH;
      const barW = (row.percent / 100) * chartW;
      const color = row.id === "vibescan" ? "#16a34a" : "#94a3b8";
      return [
        txt(margin.left - 8, y + 18, row.label, 'font-size="11" text-anchor="end" fill="#1e293b"'),
        `<rect x="${margin.left}" y="${y + 5}" width="${chartW}" height="18" rx="9" fill="#e2e8f0"/>`,
        `<rect x="${margin.left}" y="${y + 5}" width="${barW}" height="18" rx="9" fill="${color}"/>`,
        txt(margin.left + chartW + 6, y + 18, `${row.hits}/${row.total} (${row.percent.toFixed(1)}%)`, 'font-size="10" fill="#334155"'),
      ].join("\n");
    })
    .join("\n");

  const ticks = [0, 25, 50, 75, 100]
    .map((t) => {
      const x = margin.left + (t / 100) * chartW;
      return [
        `<line x1="${x}" y1="${margin.top - 4}" x2="${x}" y2="${margin.top + innerH}" stroke="#cbd5e1" stroke-dasharray="2 2"/>`,
        txt(x, svgH - 6, `${t}%`, 'font-size="9" text-anchor="middle" fill="#64748b"'),
      ].join("\n");
    })
    .join("\n");

  return `<svg viewBox="0 0 ${width} ${svgH}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${ticks}
${bars}
</svg>`;
}

// ---------------------------------------------------------------------------
// Chart 2: Recall vs Alert Volume scatter
// ---------------------------------------------------------------------------

function buildScatterSvg(rows, opts = {}) {
  const { width = 480, height = 320, title = "Recall vs. Raw Alert Volume" } = opts;
  const margin = { top: 36, right: 30, bottom: 48, left: 50 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxX = Math.max(...rows.map((r) => r.rawIssues), 1);

  const xTicks = [0, 100, 200, 300, 400, 500].filter((n) => n <= Math.max(500, maxX));
  const yTicks = [0, 20, 40, 60, 80, 100];

  const xGrid = xTicks
    .map((t) => {
      const x = margin.left + (t / maxX) * chartW;
      return [
        `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartH}" stroke="#e2e8f0"/>`,
        txt(x, height - 14, String(t), 'font-size="9" text-anchor="middle" fill="#64748b"'),
      ].join("\n");
    })
    .join("\n");

  const yGrid = yTicks
    .map((t) => {
      const y = margin.top + chartH - (t / 100) * chartH;
      return [
        `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e2e8f0"/>`,
        txt(margin.left - 6, y + 3, String(t), 'font-size="9" text-anchor="end" fill="#64748b"'),
      ].join("\n");
    })
    .join("\n");

  const pts = rows
    .map((row) => {
      const x = margin.left + (row.rawIssues / maxX) * chartW;
      const y = margin.top + chartH - (row.percent / 100) * chartH;
      const color = row.id === "vibescan" ? "#16a34a" : "#2563eb";
      const r = row.id === "vibescan" ? 6 : 4;
      return [
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.85"/>`,
        txt(x + 7, y - 6, row.label, 'font-size="9" fill="#334155"'),
      ].join("\n");
    })
    .join("\n");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1"/>
${xGrid}
${yGrid}
${pts}
${txt(width / 2, height - 2, "Raw issues reported on DVNA", 'font-size="10" text-anchor="middle" fill="#475569"')}
${txt(14, margin.top + chartH / 2, "Recall (%)", `font-size="10" text-anchor="middle" fill="#475569" transform="rotate(-90 14 ${margin.top + chartH / 2})"`)}
</svg>`;
}

// ---------------------------------------------------------------------------
// Chart 3: Coverage gap grouped bars
// ---------------------------------------------------------------------------

function buildCoverageGapSvg(dvnaCases, expandedUnique, families, opts = {}) {
  const { width = 480, height = 280, title = "Benchmark Coverage: DVNA-Only vs. Expanded" } = opts;
  const margin = { top: 36, right: 20, bottom: 70, left: 40 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const items = [
    { label: "Vulnerability\nFamilies", dvna: 5, expanded: families },
    { label: "Unique\nCases", dvna: dvnaCases, expanded: dvnaCases + expandedUnique },
  ];

  const maxY = Math.max(...items.flatMap((i) => [i.dvna, i.expanded]));
  const groupW = chartW / items.length;
  const barW = groupW * 0.28;
  const gap = 6;

  const yTicks = [0, 10, 20, 30, 40].filter((v) => v <= maxY + 5);
  const yGrid = yTicks
    .map((t) => {
      const y = margin.top + chartH - (t / maxY) * chartH;
      return [
        `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e2e8f0"/>`,
        txt(margin.left - 6, y + 3, String(t), 'font-size="9" text-anchor="end" fill="#64748b"'),
      ].join("\n");
    })
    .join("\n");

  const bars = items
    .map((item, idx) => {
      const cx = margin.left + groupW * idx + groupW / 2;
      const x1 = cx - barW - gap / 2;
      const x2 = cx + gap / 2;

      const h1 = (item.dvna / maxY) * chartH;
      const h2 = (item.expanded / maxY) * chartH;
      const y1 = margin.top + chartH - h1;
      const y2 = margin.top + chartH - h2;

      const lines = item.label.split("\n");
      const labelY = margin.top + chartH + 16;

      return [
        `<rect x="${x1}" y="${y1}" width="${barW}" height="${h1}" rx="4" fill="#94a3b8"/>`,
        txt(x1 + barW / 2, y1 - 5, String(item.dvna), 'font-size="10" text-anchor="middle" font-weight="700" fill="#334155"'),
        `<rect x="${x2}" y="${y2}" width="${barW}" height="${h2}" rx="4" fill="#16a34a"/>`,
        txt(x2 + barW / 2, y2 - 5, String(item.expanded), 'font-size="10" text-anchor="middle" font-weight="700" fill="#334155"'),
        ...lines.map((line, li) =>
          txt(cx, labelY + li * 13, line, 'font-size="10" text-anchor="middle" fill="#334155"')
        ),
      ].join("\n");
    })
    .join("\n");

  const legendY = height - 10;
  const legend = [
    `<rect x="${margin.left}" y="${legendY - 8}" width="10" height="10" rx="2" fill="#94a3b8"/>`,
    txt(margin.left + 14, legendY, "DVNA-only", 'font-size="9" fill="#475569"'),
    `<rect x="${margin.left + 80}" y="${legendY - 8}" width="10" height="10" rx="2" fill="#16a34a"/>`,
    txt(margin.left + 94, legendY, "Expanded corpus", 'font-size="9" fill="#475569"'),
  ].join("\n");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1"/>
${yGrid}
${bars}
${legend}
</svg>`;
}

// ---------------------------------------------------------------------------
// Chart 4: Mini heatmap (11 cases x 6 tools)
// ---------------------------------------------------------------------------

function buildHeatmapSvg(catalog, matrix, opts = {}) {
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const order = catalog.caseOrder || catalog.cases.map((c) => c.id);
  const byId = new Map(catalog.cases.map((c) => [c.id, c]));
  const cases = order.map((id) => byId.get(id));

  const cellW = 52;
  const cellH = 20;
  const labelW = 130;
  const headerH = 70;
  const padTop = 30;
  const padLeft = 10;

  const width = padLeft + labelW + tools.length * cellW + 10;
  const height = padTop + headerH + cases.length * cellH + 30;
  const title = opts.title || "DVNA Detection Heatmap";

  const headers = tools
    .map((t, ti) => {
      const x = padLeft + labelW + ti * cellW + cellW / 2;
      const y = padTop + headerH - 6;
      return txt(x, y, t.label, `font-size="9" text-anchor="end" fill="#334155" transform="rotate(-40 ${x} ${y})"`);
    })
    .join("\n");

  const grid = cases
    .map((c, ci) => {
      const y = padTop + headerH + ci * cellH;
      const sub = c.rowSubtitle ? ` (${c.rowSubtitle})` : "";
      const label = txt(padLeft + labelW - 6, y + 14, c.rowTitle + sub, 'font-size="9" text-anchor="end" fill="#1e293b"');
      const cells = tools
        .map((t, ti) => {
          const x = padLeft + labelW + ti * cellW;
          const hit = t.detections[c.id] === true;
          const fill = hit ? "#22c55e" : "#ef4444";
          return `<rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 1}" rx="3" fill="${fill}" opacity="0.85"/>
${txt(x + cellW / 2 - 0.5, y + 13, hit ? "\u2713" : "\u2717", `font-size="11" text-anchor="middle" fill="#fff" font-weight="700"`)}`;
        })
        .join("\n");
      return label + "\n" + cells;
    })
    .join("\n");

  const legendY = height - 12;
  const legend = [
    `<rect x="${padLeft + labelW}" y="${legendY - 8}" width="10" height="10" rx="2" fill="#22c55e"/>`,
    txt(padLeft + labelW + 14, legendY, "Detected", 'font-size="9" fill="#475569"'),
    `<rect x="${padLeft + labelW + 72}" y="${legendY - 8}" width="10" height="10" rx="2" fill="#ef4444"/>`,
    txt(padLeft + labelW + 86, legendY, "Missed", 'font-size="9" fill="#475569"'),
  ].join("\n");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${headers}
${grid}
${legend}
</svg>`;
}

// ---------------------------------------------------------------------------
// Standalone chart HTML wrapper
// ---------------------------------------------------------------------------

function wrapStandalone(title, svgContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    .card { max-width: 700px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    h1 { font-size: 1.2rem; margin: 0 0 16px; }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <div class="card">${svgContent}</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main poster HTML
// ---------------------------------------------------------------------------

function buildPosterHtml(recallSvg, scatterSvg, coverageSvg, heatmapSvg, data) {
  const { compare, dvnaCases, expandedUnique, familyCount, stressRows } = data;
  const topRecall = compare[0];
  const secondRecall = compare[1];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>VibeScan: Recall-Oriented Evaluation of a Static Security Scanner for JavaScript Applications</title>
  <style>
    :root {
      --blue: #1e3a5f;
      --blue-light: #2563eb;
      --green: #16a34a;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.45;
      padding: 12px;
    }
    .poster {
      max-width: 1440px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--border);
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    /* --- Header --- */
    .header {
      background: linear-gradient(135deg, var(--blue) 0%, #0f172a 100%);
      color: #fff;
      padding: 24px 32px;
      text-align: center;
    }
    .header h1 {
      font-size: clamp(1.4rem, 2.2vw, 2.2rem);
      font-weight: 800;
      letter-spacing: -0.01em;
      line-height: 1.25;
    }
    .header .subtitle {
      margin-top: 6px;
      font-size: clamp(0.85rem, 1.1vw, 1.1rem);
      opacity: 0.9;
      font-weight: 400;
    }
    .header .meta {
      margin-top: 6px;
      font-size: 0.88rem;
      opacity: 0.75;
    }

    /* --- 3-column grid --- */
    .content {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1.15fr;
      gap: 0;
    }
    .col {
      padding: 16px 18px;
      border-right: 1px solid var(--border);
    }
    .col:last-child { border-right: none; }

    /* --- Section blocks --- */
    .sec { margin-bottom: 16px; }
    .sec-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--blue);
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 2px solid var(--blue-light);
    }
    .sec p, .sec li {
      font-size: 0.88rem;
      color: var(--text);
      line-height: 1.5;
    }
    .sec p { margin-bottom: 8px; }
    .sec ul {
      padding-left: 16px;
      margin-bottom: 8px;
    }
    .sec li { margin-bottom: 4px; }

    /* --- Key numbers strip --- */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-box {
      text-align: center;
      padding: 10px 4px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #f0f9ff;
    }
    .kpi-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--blue);
    }
    .kpi-label {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 2px;
    }

    /* --- Figure blocks --- */
    .fig {
      margin-bottom: 14px;
    }
    .fig-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .fig-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      background: #fafbfd;
    }
    .fig-caption {
      font-size: 0.78rem;
      color: var(--muted);
      margin-top: 6px;
      line-height: 1.4;
    }

    /* --- Dataset table --- */
    .ds-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      margin: 8px 0;
    }
    .ds-table th, .ds-table td {
      border: 1px solid var(--border);
      padding: 5px 8px;
      text-align: left;
    }
    .ds-table th { background: #f1f5f9; font-weight: 600; }

    /* --- Footer --- */
    .footer {
      border-top: 1px solid var(--border);
      padding: 10px 18px;
      font-size: 0.78rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* --- Print --- */
    @media print {
      @page { size: A1 landscape; margin: 8mm; }
      body { background: #fff; padding: 0; }
      .poster { box-shadow: none; max-width: none; border: none; }
      .header, .sec-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @media (max-width: 1000px) {
      .content { grid-template-columns: 1fr; }
      .col { border-right: none; border-bottom: 1px solid var(--border); }
    }
  </style>
</head>
<body>
<main class="poster">

  <header class="header">
    <h1>VibeScan: Recall-Oriented Evaluation of a Static Security Scanner for JavaScript Applications</h1>
    <div class="subtitle">A Benchmark-Driven Study of Detection Recall, Coverage Gaps, and Alert-Volume Misinterpretation</div>
    <div class="meta">Josh Obersteadt &middot; Consortium for Computing Sciences in Colleges (CCSC) &middot; 2026</div>
  </header>

  <section class="content">

    <!-- ============ COLUMN 1 ============ -->
    <div class="col">

      <div class="sec">
        <h2 class="sec-title">Abstract</h2>
        <p>
          AI-assisted code generation accelerates software delivery but routinely introduces insecure defaults
          such as unsanitized inputs, weak cryptographic choices, and missing access controls. Static analysis
          tools can detect these patterns, yet evaluating scanner effectiveness is complicated by reliance on
          narrow legacy benchmarks and the common but misleading practice of equating raw alert volume with
          detection quality.
        </p>
        <p>
          We present a benchmark-driven evaluation of <strong>VibeScan</strong>, a JavaScript/TypeScript
          static-analysis scanner, using (1) the Damn Vulnerable Node.js Application (DVNA) as a standardized
          11-case cross-tool benchmark and (2) an expanded 39-case corpus covering all six VibeScan rule
          families. VibeScan achieves <strong>${topRecall.percent.toFixed(1)}% recall</strong> on DVNA
          (next-best: ${secondRecall.label} at ${secondRecall.percent.toFixed(1)}%), while exposing that DVNA
          alone understates scanner breadth by missing entire vulnerability classes. We further show that raw
          alert count is not a reliable proxy for recall in this dataset.
        </p>
      </div>

      <div class="sec">
        <h2 class="sec-title">Research Questions</h2>
        <ul>
          <li><strong>RQ1:</strong> Can a JS/TS-focused static scanner achieve top recall on a standard vulnerable application benchmark?</li>
          <li><strong>RQ2:</strong> Do legacy benchmarks like DVNA understate the coverage breadth of a scanner with broader rule families?</li>
          <li><strong>RQ3:</strong> Is raw alert count a reliable indicator of benchmark recall across tools?</li>
        </ul>
      </div>

      <div class="sec">
        <h2 class="sec-title">Background</h2>
        <p>
          DVNA is an intentionally vulnerable Express/Node.js application commonly used to evaluate SAST tools.
          It contains 11 adjudicated vulnerability families spanning injection, cryptography, access control,
          and cross-site scripting. Prior evaluations typically report detection counts, which conflate scanner
          noise with benchmark coverage.
        </p>
        <p>
          We compare six SAST tools: VibeScan, Bearer, Snyk Code, Semgrep, CodeQL, and eslint-plugin-security.
          Each tool was run on a pinned DVNA commit with frozen configurations. Results were scored against
          line-anchored ground-truth cases rather than raw finding counts.
        </p>
      </div>

      <div class="sec">
        <h2 class="sec-title">Discussion</h2>
        <p>
          <strong>RQ1 (Recall):</strong> VibeScan ranks first on DVNA with 11/11 recall. The gap over Bearer
          (8/11) and Snyk Code (7/11) stems from coverage of NoSQL injection contexts and environment-secret
          fallback patterns that most peer tools miss.
        </p>
        <p>
          <strong>RQ2 (Coverage gap):</strong> DVNA exercises only 5 of VibeScan's 6 rule families, omitting
          SSRF, cookie-flag, SSTI, and IDOR cases. Expanding the corpus from 11 to ${dvnaCases + expandedUnique}
          unique cases reveals that legacy benchmarks systematically undercount scanner capability.
        </p>
        <p>
          <strong>RQ3 (Volume vs. recall):</strong> eslint-plugin-security reports 493 alerts but detects only
          1/11 cases. CodeQL reports 46 alerts but detects 6/11. More alerts do not correspond to higher recall
          in this dataset.
        </p>
      </div>

    </div>

    <!-- ============ COLUMN 2 ============ -->
    <div class="col">

      <div class="sec">
        <h2 class="sec-title">Method</h2>
        <table class="ds-table">
          <thead><tr><th>Dataset</th><th>Cases</th><th>Scope</th></tr></thead>
          <tbody>
            <tr><td>A: DVNA benchmark</td><td>${dvnaCases}</td><td>Cross-tool recall comparison (6 SAST tools)</td></tr>
            <tr><td>B: Expanded corpus</td><td>${expandedUnique} unique</td><td>VibeScan-specific breadth across all ${familyCount} rule families</td></tr>
            <tr><td>B+: Stress repeats</td><td>${stressRows}</td><td>Robustness validation (not unique families)</td></tr>
          </tbody>
        </table>
        <p>
          Each case is defined by a line-anchored ground-truth entry with expected rule identifiers.
          A case is "hit" when the scanner reports a finding matching both the anchor file and line range.
          Scoring is deterministic and enforced by CI regression gates.
        </p>
      </div>

      <div class="fig">
        <div class="fig-label">Figure 1 &mdash; DVNA Recall by Tool</div>
        <div class="fig-card">${recallSvg}</div>
        <div class="fig-caption">
          Benchmark recall on 11 adjudicated DVNA cases. VibeScan achieves 100% recall; the next-best tool
          (${secondRecall.label}) reaches ${secondRecall.percent.toFixed(1)}%. Bar length represents recall, not
          raw alert count.
        </div>
      </div>

      <div class="fig">
        <div class="fig-label">Figure 2 &mdash; Recall vs. Raw Alert Volume</div>
        <div class="fig-card">${scatterSvg}</div>
        <div class="fig-caption">
          Each point represents one tool. The x-axis shows total alerts reported on DVNA; the y-axis shows
          benchmark recall. Tools reporting more alerts (rightward) do not achieve higher recall (upward),
          demonstrating that alert volume is not a proxy for detection quality. VibeScan sits at the top-left:
          highest recall, moderate alert count.
        </div>
      </div>

    </div>

    <!-- ============ COLUMN 3 ============ -->
    <div class="col">

      <div class="sec">
        <h2 class="sec-title">Results</h2>
        <div class="kpi-strip">
          <div class="kpi-box">
            <div class="kpi-val">100%</div>
            <div class="kpi-label">DVNA recall<br/>(VibeScan)</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val">${secondRecall.percent.toFixed(1)}%</div>
            <div class="kpi-label">DVNA recall<br/>(next-best)</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val">${dvnaCases + expandedUnique}</div>
            <div class="kpi-label">Unique cases<br/>(expanded)</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-val">${familyCount}</div>
            <div class="kpi-label">Rule families<br/>covered</div>
          </div>
        </div>
      </div>

      <div class="fig">
        <div class="fig-label">Figure 3 &mdash; Benchmark Coverage Gap</div>
        <div class="fig-card">${coverageSvg}</div>
        <div class="fig-caption">
          DVNA alone tests ${dvnaCases} cases across 5 vulnerability families. Expanding the corpus to include
          all ${familyCount} VibeScan rule families reveals ${expandedUnique} additional unique cases that DVNA
          misses entirely, including SSRF, cookie-flag, SSTI, and IDOR patterns.
        </div>
      </div>

      <div class="fig">
        <div class="fig-label">Figure 4 &mdash; DVNA Detection Heatmap</div>
        <div class="fig-card">${heatmapSvg}</div>
        <div class="fig-caption">
          Per-case detection outcomes across 6 tools on the 11 DVNA cases. Green = detected, red = missed.
          VibeScan is the only tool with a fully green column. Most tools miss at least one NoSQL variant or
          the environment-secret fallback.
        </div>
      </div>

      <div class="sec">
        <h2 class="sec-title">Limitations &amp; Future Work</h2>
        <ul>
          <li>Peer tools are compared only on the 11-case DVNA subset; the expanded corpus is VibeScan-specific.</li>
          <li>No precision/false-positive lane is included in this evaluation.</li>
          <li>DVNA is one vulnerable application class (Express/MongoDB); results may not generalize to other frameworks.</li>
          <li>The ${stressRows} stress-repeat rows test robustness, not unique vulnerability breadth.</li>
        </ul>
        <p>
          Future work: cross-tool evaluation on the expanded corpus, a precision lane, additional real-world
          benchmark applications, and a developer usability study measuring time-to-triage on VibeScan's
          proof-oriented outputs versus conventional alert-only tools.
        </p>
      </div>

    </div>

  </section>

  <footer class="footer">
    <span>DVNA: github.com/appsecco/dvna (commit 9ba473a) &middot; VibeScan v1.1.0 &middot; npm: @jobersteadt/vibescan</span>
    <span>Data: results/dvna-detection-matrix.json &middot; results/framework-vuln-case-catalog.json &middot; results/rule-family-coverage-manifest.json</span>
  </footer>

</main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const dvnaMatrix = readJson("results/dvna-detection-matrix.json");
  const dvnaCatalog = readJson("results/dvna-case-catalog.json");
  const frameworkCatalog = readJson("results/framework-vuln-case-catalog.json");
  const highVolumeCatalog = readJson("results/framework-vuln-case-catalog-high-volume.json");
  const manifest = readJson("results/rule-family-coverage-manifest.json");

  const compare = loadCompareRows(dvnaMatrix);
  const dvnaCases = dvnaCatalog.cases.length;
  const expandedUnique = frameworkCatalog.cases.length;
  const stressRows = highVolumeCatalog.cases.length;
  const familyCount = manifest.families.length;

  const recallSvg = buildRecallBarSvg(compare);
  const scatterSvg = buildScatterSvg(compare);
  const coverageSvg = buildCoverageGapSvg(dvnaCases, expandedUnique, familyCount);
  const heatmapSvg = buildHeatmapSvg(dvnaCatalog, dvnaMatrix);

  mkdirSync(chartsDir, { recursive: true });
  mkdirSync(dirname(posterPath), { recursive: true });

  const posterHtml = buildPosterHtml(recallSvg, scatterSvg, coverageSvg, heatmapSvg, {
    compare,
    dvnaCases,
    expandedUnique,
    familyCount,
    stressRows,
  });
  writeFileSync(posterPath, posterHtml, "utf8");
  console.log(`Wrote ${posterPath}`);

  writeFileSync(
    join(chartsDir, "vibescan-dvna-recall-bar-chart.html"),
    wrapStandalone("DVNA Recall by Tool", recallSvg),
    "utf8"
  );
  writeFileSync(
    join(chartsDir, "vibescan-recall-vs-volume-scatter.html"),
    wrapStandalone("Recall vs. Raw Alert Volume", scatterSvg),
    "utf8"
  );
  writeFileSync(
    join(chartsDir, "vibescan-coverage-gap-chart.html"),
    wrapStandalone("Benchmark Coverage Gap", coverageSvg),
    "utf8"
  );
  writeFileSync(
    join(chartsDir, "vibescan-dvna-heatmap-mini.html"),
    wrapStandalone("DVNA Detection Heatmap", heatmapSvg),
    "utf8"
  );

  console.log(`Wrote ${join(chartsDir, "vibescan-dvna-recall-bar-chart.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-recall-vs-volume-scatter.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-coverage-gap-chart.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-dvna-heatmap-mini.html")}`);
}

main();
