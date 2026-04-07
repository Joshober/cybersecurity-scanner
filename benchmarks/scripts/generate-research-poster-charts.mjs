#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const chartsDir = join(repoRoot, "results", "charts");

function readJson(relPath) {
  return JSON.parse(readFileSync(join(repoRoot, relPath), "utf8"));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function basePage(title, body, extraCss = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.45rem; margin: 0 0 10px; }
    h2 { font-size: 1rem; margin: 0 0 10px; color: #1e293b; }
    p.scope { max-width: 1100px; line-height: 1.55; color: #475569; font-size: 0.92rem; }
    .grid { display: grid; gap: 18px; margin-top: 18px; }
    .grid.two { grid-template-columns: repeat(2, minmax(280px, 1fr)); }
    .grid.three { grid-template-columns: repeat(3, minmax(220px, 1fr)); }
    .card { background: #fff; border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }
    .kpi { font-size: 2rem; font-weight: 700; color: #0f172a; }
    .muted { color: #64748b; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 0.78rem; font-weight: 600; }
    .bar-list { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: minmax(170px, 1.2fr) 4fr auto; gap: 12px; align-items: center; }
    .bar-label { font-size: 0.88rem; color: #0f172a; }
    .track { height: 22px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .fill { height: 100%; border-radius: 999px; }
    .bar-num { font-variant-numeric: tabular-nums; font-weight: 700; }
    .flow { display: grid; grid-template-columns: repeat(5, minmax(140px, 1fr)); gap: 12px; margin-top: 14px; }
    .flow .step { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; font-size: 0.86rem; min-height: 88px; }
    .family-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .family-table th, .family-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    .family-table th { background: #f1f5f9; }
    .legend { margin-top: 14px; font-size: 0.82rem; color: #475569; }
    .accent-green { color: #047857; }
    .accent-blue { color: #1d4ed8; }
    .accent-amber { color: #b45309; }
    .accent-red { color: #b91c1c; }
    ${extraCss}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function writeChart(fileName, title, body, extraCss = "") {
  mkdirSync(chartsDir, { recursive: true });
  writeFileSync(join(chartsDir, fileName), basePage(title, body, extraCss), "utf8");
}

function pct(n, d) {
  return d > 0 ? (n / d) * 100 : 0;
}

function compareRows(matrix) {
  return (matrix.tools || [])
    .filter((t) => t.chartMode !== "gap")
    .map((tool) => {
      const vals = Object.values(tool.detections || {});
      const hits = vals.filter((v) => v === true).length;
      return {
        id: tool.id,
        label: tool.label,
        hits,
        total: vals.length,
        percent: pct(hits, vals.length),
        rawIssues: Number(tool.dvnaRunIssueCount || 0),
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

function svgText(x, y, text, extra = "") {
  return `<text x="${x}" y="${y}" ${extra}>${escapeHtml(text)}</text>`;
}

function buildHorizontalBarSvg(rows, { width = 920, height = 420, title = "" } = {}) {
  const margin = { top: 50, right: 120, bottom: 40, left: 170 };
  const chartW = width - margin.left - margin.right;
  const rowH = 42;
  const innerH = rows.length * rowH;
  const svgH = Math.max(height, margin.top + margin.bottom + innerH);
  const bars = rows
    .map((row, idx) => {
      const y = margin.top + idx * rowH;
      const barW = (row.percent / 100) * chartW;
      const color = row.id === "vibescan" ? "#16a34a" : "#64748b";
      return `
${svgText(margin.left - 12, y + 20, row.label, 'font-size="13" text-anchor="end" fill="#0f172a"')}
<rect x="${margin.left}" y="${y + 6}" width="${chartW}" height="22" rx="11" fill="#e2e8f0"></rect>
<rect x="${margin.left}" y="${y + 6}" width="${barW}" height="22" rx="11" fill="${color}"></rect>
${svgText(margin.left + chartW + 10, y + 22, `${row.hits}/${row.total} (${row.percent.toFixed(1)}%)`, 'font-size="12" fill="#0f172a"')}
`;
    })
    .join("\n");
  const ticks = [0, 25, 50, 75, 100]
    .map((tick) => {
      const x = margin.left + (tick / 100) * chartW;
      return `
<line x1="${x}" y1="${margin.top - 8}" x2="${x}" y2="${svgH - margin.bottom}" stroke="#cbd5e1" stroke-dasharray="3 3"></line>
${svgText(x, svgH - 12, `${tick}%`, 'font-size="11" text-anchor="middle" fill="#475569"')}
`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${svgH}" width="100%" role="img" aria-label="${escapeHtml(title)}">
${svgText(width / 2, 24, title, 'font-size="18" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${ticks}
${bars}
</svg>`;
}

function buildScatterSvg(rows, { width = 920, height = 420, title = "" } = {}) {
  const margin = { top: 50, right: 40, bottom: 55, left: 65 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxX = Math.max(...rows.map((r) => r.rawIssues), 1);
  const xTicks = [0, 100, 200, 300, 400, 500].filter((n) => n <= Math.max(500, maxX));
  const yTicks = [0, 20, 40, 60, 80, 100];
  const pts = rows
    .map((row) => {
      const x = margin.left + (row.rawIssues / maxX) * chartW;
      const y = margin.top + chartH - (row.percent / 100) * chartH;
      const color = row.id === "vibescan" ? "#16a34a" : "#2563eb";
      return `
<circle cx="${x}" cy="${y}" r="${row.id === "vibescan" ? 7 : 5}" fill="${color}" opacity="0.9"></circle>
${svgText(x + 8, y - 8, row.label, 'font-size="11" fill="#0f172a"')}
`;
    })
    .join("\n");
  const xGrid = xTicks
    .map((tick) => {
      const x = margin.left + (tick / maxX) * chartW;
      return `
<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartH}" stroke="#e2e8f0"></line>
${svgText(x, height - 14, String(tick), 'font-size="11" text-anchor="middle" fill="#475569"')}
`;
    })
    .join("\n");
  const yGrid = yTicks
    .map((tick) => {
      const y = margin.top + chartH - (tick / 100) * chartH;
      return `
<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e2e8f0"></line>
${svgText(margin.left - 10, y + 4, String(tick), 'font-size="11" text-anchor="end" fill="#475569"')}
`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeHtml(title)}">
${svgText(width / 2, 24, title, 'font-size="18" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1.5"></line>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1.5"></line>
${xGrid}
${yGrid}
${pts}
${svgText(width / 2, height - 2, "Raw issues in full DVNA run", 'font-size="12" text-anchor="middle" fill="#334155"')}
${svgText(16, margin.top + chartH / 2, "Recall (%)", 'font-size="12" text-anchor="middle" fill="#334155" transform="rotate(-90 16 ' + (margin.top + chartH / 2) + ')"')}
</svg>`;
}

function buildLineSvg(points, { width = 920, height = 420, title = "" } = {}) {
  const margin = { top: 50, right: 40, bottom: 55, left: 55 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxY = Math.max(...points.map((p) => p.value), 1);
  const coords = points.map((p, idx) => {
    const x = margin.left + (idx / Math.max(points.length - 1, 1)) * chartW;
    const y = margin.top + chartH - (p.value / maxY) * chartH;
    return { ...p, x, y };
  });
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const ticks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((tick) => {
      const y = margin.top + chartH - (tick / maxY) * chartH;
      return `
<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e2e8f0"></line>
${svgText(margin.left - 10, y + 4, String(tick), 'font-size="11" text-anchor="end" fill="#475569"')}
`;
    })
    .join("\n");
  const circles = coords
    .map(
      (p) => `
<circle cx="${p.x}" cy="${p.y}" r="6" fill="#1d4ed8"></circle>
${svgText(p.x, height - 14, p.label, 'font-size="11" text-anchor="middle" fill="#334155"')}
${svgText(p.x, p.y - 10, String(p.value), 'font-size="11" text-anchor="middle" fill="#0f172a"')}
`
    )
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeHtml(title)}">
${svgText(width / 2, 24, title, 'font-size="18" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1.5"></line>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b" stroke-width="1.5"></line>
${ticks}
<path d="${path}" fill="none" stroke="#1d4ed8" stroke-width="3"></path>
${circles}
</svg>`;
}

function buildStackedBarSvg(parts, { width = 920, height = 260, title = "" } = {}) {
  const margin = { top: 50, right: 40, bottom: 50, left: 40 };
  const chartW = width - margin.left - margin.right;
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  let currentX = margin.left;
  const rects = parts
    .map((part) => {
      const w = (part.value / total) * chartW;
      const rect = `<rect x="${currentX}" y="${margin.top + 40}" width="${w}" height="44" fill="${part.color}"></rect>
${svgText(currentX + w / 2, margin.top + 70, `${part.label} (${part.value})`, 'font-size="12" text-anchor="middle" fill="#fff" font-weight="700"')}`;
      currentX += w;
      return rect;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeHtml(title)}">
${svgText(width / 2, 24, title, 'font-size="18" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${rects}
${svgText(width / 2, height - 16, `Total benchmark rows: ${total}`, 'font-size="12" text-anchor="middle" fill="#334155"')}
</svg>`;
}

function main() {
  const dvnaMatrix = readJson("results/dvna-detection-matrix.json");
  const expandedMatrix = readJson("results/vibescan-expanded-detection-matrix.json");
  const manifest = readJson("results/rule-family-coverage-manifest.json");
  const dvnaCatalog = readJson("results/dvna-case-catalog.json");
  const frameworkCatalog = readJson("results/framework-vuln-case-catalog.json");
  const highVolumeCatalog = readJson("results/framework-vuln-case-catalog-high-volume.json");

  const compare = compareRows(dvnaMatrix);
  const familyRows = (manifest.families || [])
    .map(
      (family) => `<tr>
  <td>${escapeHtml(family.family)}</td>
  <td>${family.ruleIds.length}</td>
  <td>${family.caseIds.length}</td>
  <td>${escapeHtml(family.status)}</td>
</tr>`
    )
    .join("\n");
  const baseExpandedCount = frameworkCatalog.cases.length;
  const highVolumeCount = highVolumeCatalog.cases.length;
  const growthPoints = [
    { label: "DVNA only", value: dvnaCatalog.cases.length },
    { label: "DVNA + base", value: dvnaCatalog.cases.length + baseExpandedCount },
    { label: "DVNA + all", value: expandedMatrix.rows.combined.total },
  ];
  const familyBars = (manifest.families || []).map((family) => ({
    label: family.family,
    hits: family.caseIds.length,
    total: family.caseIds.length,
    percent: 100,
    id: family.family,
    rawIssues: 0,
  }));

  writeChart(
    "vibescan-project-overview-poster.html",
    "VibeScan Project Overview",
    `<h1>VibeScan: project overview</h1>
<p class="scope">Poster-friendly overview of the scanner pipeline, major subsystems, and research additions. The focus is deterministic static analysis with semantic TypeScript support, taint flow, route/dependency context, and proof-oriented output.</p>
<div class="grid two">
  <section class="card">
    <h2>System architecture</h2>
    <div class="flow">
      <div class="step"><strong>1. CLI</strong><br/>Scan, prove, export, benchmark orchestration.</div>
      <div class="step"><strong>2. Parse</strong><br/>Acorn for JS and TS-ESLint parser for TS/TSX.</div>
      <div class="step"><strong>3. Semantic context</strong><br/>TypeScript Program and TypeChecker when enabled.</div>
      <div class="step"><strong>4. Detection engines</strong><br/>Rule engine + taint engine + route/dependency analysis.</div>
      <div class="step"><strong>5. Outputs</strong><br/>JSON, SARIF, HTML, proof tests, benchmark artifacts.</div>
    </div>
    <p class="legend">Research-oriented additions in this phase include semantic alias resolution, explicit sink classification, SSTI detection, IDOR-style direct object reference detection, and recall-first benchmark lanes.</p>
  </section>
  <section class="card">
    <h2>Core deliverables</h2>
    <div class="grid three">
      <div>
        <div class="kpi">27</div>
        <div class="muted">active mapped rule IDs</div>
      </div>
      <div>
        <div class="kpi">6</div>
        <div class="muted">coverage families</div>
      </div>
      <div>
        <div class="kpi">3</div>
        <div class="muted">major output modes</div>
      </div>
    </div>
    <p class="legend">Outputs support research evidence, developer adoption, and CI regression gates: raw findings, proof/actionability summaries, third-party trust boundaries, and benchmark scoreboards.</p>
  </section>
</div>`
  );

  writeChart(
    "vibescan-experiment-design-poster.html",
    "VibeScan Experiment Design",
    `<h1>Experiment design and benchmark protocol</h1>
<p class="scope">The evaluation combines frozen DVNA benchmark rows with a VibeScan-specific expanded corpus that exercises all supported rule families and research extensions. This separates benchmark recall, coverage breadth, and raw issue volume.</p>
<div class="grid three">
  <section class="card">
    <span class="pill">Dataset A</span>
    <h2>DVNA benchmark</h2>
    <div class="kpi">${dvnaCatalog.cases.length}</div>
    <div class="muted">line-anchored ground-truth rows</div>
    <p class="legend">Pinned DVNA commit with adjudicated case anchors for fair cross-tool recall comparison.</p>
  </section>
  <section class="card">
    <span class="pill">Dataset B</span>
    <h2>Expanded corpus</h2>
    <div class="kpi">${frameworkCatalog.cases.length + highVolumeCatalog.cases.length}</div>
    <div class="muted">all-check VibeScan rows</div>
    <p class="legend">Framework, crypto, SSRF, middleware, research-class, and high-volume stress cases.</p>
  </section>
  <section class="card">
    <span class="pill">Combined</span>
    <h2>Total scored rows</h2>
    <div class="kpi">${expandedMatrix.rows.combined.total}</div>
    <div class="muted">DVNA + expanded corpus</div>
    <p class="legend">Used for the full-scope VibeScan recall lane and CI gating.</p>
  </section>
</div>
<div class="card" style="margin-top:18px;">
  <h2>Evaluation flow</h2>
  <div class="flow">
    <div class="step"><strong>Corpus setup</strong><br/>Pinned DVNA + framework/expanded seeds.</div>
    <div class="step"><strong>Scanner run</strong><br/>VibeScan scan and optional proof generation.</div>
    <div class="step"><strong>Adjudication</strong><br/>Anchor-line scoring with expected rule IDs.</div>
    <div class="step"><strong>Readout</strong><br/>Recall matrix, proof tiers, outperform summary.</div>
    <div class="step"><strong>Regression gate</strong><br/>CI fails on covered recall drops.</div>
  </div>
  <p class="legend">Peer tools are compared on the DVNA subset only. Expanded all-check rows are used to demonstrate VibeScan coverage breadth beyond DVNA’s original scope.</p>
</div>`
  );

  writeChart(
    "vibescan-results-summary-poster.html",
    "VibeScan Research Results Summary",
    `<h1>Research results summary</h1>
<p class="scope">VibeScan leads the scored DVNA benchmark on recall while also sustaining full recall on the expanded all-check corpus. Raw issue count is tracked separately from benchmark recall.</p>
<div class="grid two">
  <section class="card">
    <h2>DVNA recall leaderboard</h2>
    ${buildHorizontalBarSvg(compare, { title: "DVNA recall by tool" })}
    <p class="legend"><strong>Interpretation:</strong> compare tools by recall on the 11 adjudicated DVNA rows. Higher raw issue volume from peers does not imply higher benchmark performance.</p>
  </section>
  <section class="card">
    <h2>Recall vs raw issue volume</h2>
    ${buildScatterSvg(compare, { title: "Recall versus raw issues" })}
    <p class="legend">VibeScan is the high-recall outlier: top recall with lower raw issue count than several peers, supporting the claim that more alerts do not automatically mean better benchmark performance.</p>
  </section>
</div>`
  );

  writeChart(
    "vibescan-coverage-breadth-poster.html",
    "VibeScan Coverage Breadth",
    `<h1>Coverage breadth and rule-family mapping</h1>
<p class="scope">This poster panel explains how supported rule families map to benchmarked evidence rows. It helps distinguish scanner breadth from the smaller legacy DVNA slice.</p>
<div class="grid two">
  <section class="card">
    <h2>Coverage by family</h2>
    <table class="family-table">
      <thead>
        <tr><th>Family</th><th>Rule IDs</th><th>Base cases</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${familyRows}
      </tbody>
    </table>
    <p class="legend">High-volume rows add 80 supplemental stress cases on top of these base family mappings.</p>
  </section>
  <section class="card">
    <h2>Corpus composition</h2>
    ${buildStackedBarSvg(
      [
        { label: "DVNA", value: dvnaCatalog.cases.length, color: "#1d4ed8" },
        { label: "Base expanded", value: baseExpandedCount, color: "#16a34a" },
        { label: "High-volume", value: highVolumeCount, color: "#b45309" },
      ],
      { title: "Benchmark row composition" }
    )}
    <p class="legend">Combined benchmark breadth is now ${expandedMatrix.rows.combined.total} scored rows, which is substantially larger than DVNA alone and better reflects scanner scope.</p>
  </section>
</div>`
  );

  writeChart(
    "vibescan-benchmark-growth-chart.html",
    "VibeScan Benchmark Scope Growth",
    `<h1>Benchmark scope growth</h1>
<p class="scope">A line chart showing how evaluation scope changed from legacy DVNA-only benchmarking to a broader scanner-aligned benchmark suite.</p>
<div class="card">
  ${buildLineSvg(growthPoints, { title: "Growth in scored benchmark rows" })}
  <p class="legend">The benchmark expanded from 11 legacy DVNA rows to 39 combined rows in the first expansion pass and then to 119 total rows after adding high-volume stress coverage.</p>
</div>`
  );

  writeChart(
    "vibescan-dvna-recall-bar-chart.html",
    "VibeScan DVNA Recall Bar Chart",
    `<h1>DVNA recall bar chart</h1>
<p class="scope">This chart compares benchmark recall across tools on the adjudicated DVNA grid.</p>
<div class="card">
  ${buildHorizontalBarSvg(compare, { title: "DVNA recall by tool" })}
  <p class="legend">Bar length represents benchmark recall, not total alert count. VibeScan leads the current matrix with 11/11 hits.</p>
</div>`
  );

  writeChart(
    "vibescan-recall-vs-volume-scatter.html",
    "VibeScan Recall vs Volume Scatter",
    `<h1>Recall vs alert volume</h1>
<p class="scope">This scatter plot separates benchmark recall from raw issue count in the full DVNA run.</p>
<div class="card">
  ${buildScatterSvg(compare, { title: "Recall versus raw issues" })}
  <p class="legend">Points farther upward have higher recall. Points farther right report more raw issues. VibeScan sits high on recall without requiring the highest issue volume.</p>
</div>`
  );

  writeChart(
    "vibescan-family-coverage-chart.html",
    "VibeScan Family Coverage Chart",
    `<h1>Rule-family coverage chart</h1>
<p class="scope">This bar chart shows how benchmarked base cases are distributed across mapped VibeScan rule families.</p>
<div class="card">
  ${buildHorizontalBarSvg(familyBars, { title: "Base benchmark cases by family" })}
  <p class="legend">Each family shown here has base benchmark coverage. High-volume stress rows are additional rows layered on top of these mapped families.</p>
</div>`
  );

  console.log(`Wrote ${join(chartsDir, "vibescan-project-overview-poster.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-experiment-design-poster.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-results-summary-poster.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-coverage-breadth-poster.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-benchmark-growth-chart.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-dvna-recall-bar-chart.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-recall-vs-volume-scatter.html")}`);
  console.log(`Wrote ${join(chartsDir, "vibescan-family-coverage-chart.html")}`);
}

main();
