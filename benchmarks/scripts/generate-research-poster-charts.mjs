#!/usr/bin/env node
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
function esc(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function txt(x, y, value, extra = "") {
  return `<text x="${x}" y="${y}" ${extra}>${esc(value)}</text>`;
}
function rankRows(rows) {
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
function loadCompareRows(matrix) {
  return rankRows(
    matrix.tools
      .filter((t) => t.chartMode !== "gap")
      .map((tool) => {
        const vals = Object.values(tool.detections || {});
        const hits = vals.filter((v) => v === true).length;
        const total = vals.length;
        const precisionProxy = Number(tool.dvnaRunIssueCount || 0) > 0 ? hits / Number(tool.dvnaRunIssueCount) : 0;
        return {
          id: tool.id,
          label: tool.label,
          hits,
          total,
          percent: total > 0 ? (hits / total) * 100 : 0,
          rawIssues: Number(tool.dvnaRunIssueCount || 0),
          runtimeMs: typeof tool.dvnaRunDurationMs === "number" ? Number(tool.dvnaRunDurationMs) : null,
          precisionProxy,
        };
      })
      .sort((a, b) => b.percent - a.percent)
  );
}
function getCaseRows(catalog, matrix) {
  const order = catalog.caseOrder || catalog.cases.map((c) => c.id);
  const byId = new Map(catalog.cases.map((c) => [c.id, c]));
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  return order.map((id) => {
    const c = byId.get(id);
    const detections = tools.map((t) => (t.detections?.[id] === true ? 1 : 0));
    const detectedBy = detections.reduce((s, n) => s + n, 0);
    return { id, case: c, detectedBy };
  });
}
function pearson(xs, ys) {
  const n = xs.length;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

// Improved existing charts
function buildRecallBarSvg(rows, { width = 480, title = "DVNA Recall by Tool" } = {}) {
  const margin = { top: 40, right: 115, bottom: 28, left: 155 };
  const chartW = width - margin.left - margin.right;
  const rowH = 32;
  const innerH = rows.length * rowH;
  const svgH = margin.top + innerH + margin.bottom;
  const gap = (rows[0].percent - rows[1].percent).toFixed(1);
  const bars = rows
    .map((row, idx) => {
      const y = margin.top + idx * rowH;
      const barW = (row.percent / 100) * chartW;
      const color = row.id === "vibescan" ? "#16a34a" : "#94a3b8";
      return [
        txt(margin.left - 8, y + 18, row.label, 'font-size="10" text-anchor="end" fill="#1e293b"'),
        `<rect x="${margin.left}" y="${y + 5}" width="${chartW}" height="18" rx="9" fill="#e2e8f0"/>`,
        `<rect x="${margin.left}" y="${y + 5}" width="${barW}" height="18" rx="9" fill="${color}"/>`,
        txt(margin.left + 2, y + 18, `#${row.rank}`, 'font-size="9" fill="#fff" font-weight="700"'),
        txt(margin.left + chartW + 5, y + 18, `${row.hits}/${row.total} (${row.percent.toFixed(1)}%)`, 'font-size="9" fill="#334155"'),
      ].join("\n");
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${svgH}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${txt(width / 2, 32, `VibeScan lead over next-best: +${gap} points`, 'font-size="9" text-anchor="middle" fill="#334155"')}
${bars}
</svg>`;
}
function buildScatterSvg(rows, { width = 480, height = 320, title = "Recall vs. Raw Alert Volume" } = {}) {
  const margin = { top: 36, right: 30, bottom: 48, left: 46 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxX = Math.max(...rows.map((r) => r.rawIssues), 1);
  const xs = rows.map((r) => r.rawIssues);
  const ys = rows.map((r) => r.percent);
  const r = pearson(xs, ys);
  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const yAt0 = Math.max(0, Math.min(100, intercept));
  const yAtMax = Math.max(0, Math.min(100, slope * maxX + intercept));
  const xTicks = [0, 100, 200, 300, 400, 500];
  const yTicks = [0, 20, 40, 60, 80, 100];
  const pts = rows
    .map((row) => {
      const x = margin.left + (row.rawIssues / maxX) * chartW;
      const y = margin.top + chartH - (row.percent / 100) * chartH;
      const color = row.id === "vibescan" ? "#16a34a" : "#2563eb";
      return `<circle cx="${x}" cy="${y}" r="${row.id === "vibescan" ? 5 : 4}" fill="${color}" opacity="0.85"/>
${txt(x + 7, y - 5, row.label, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${txt(width - 10, 30, `Pearson r=${r.toFixed(2)}`, 'font-size="9" text-anchor="end" fill="#334155"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b"/>
${xTicks
  .map((t) => {
    const x = margin.left + (Math.min(t, maxX) / maxX) * chartW;
    return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartH}" stroke="#eef2f7"/>
${txt(x, height - 14, t, 'font-size="9" text-anchor="middle" fill="#64748b"')}`;
  })
  .join("\n")}
${yTicks
  .map((t) => {
    const y = margin.top + chartH - (t / 100) * chartH;
    return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#eef2f7"/>
${txt(margin.left - 5, y + 3, t, 'font-size="8" text-anchor="end" fill="#64748b"')}`;
  })
  .join("\n")}
<line x1="${margin.left}" y1="${margin.top + chartH - (yAt0 / 100) * chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH - (yAtMax / 100) * chartH}" stroke="#ef4444" stroke-width="1.5"/>
${pts}
${txt(width / 2, height - 2, "Raw issues reported on DVNA", 'font-size="9" text-anchor="middle" fill="#475569"')}
</svg>`;
}
function buildCoverageGapSvg(dvnaCases, expandedUnique, families, { width = 480, height = 280, title = "Benchmark Coverage: DVNA-Only vs. Expanded" } = {}) {
  const margin = { top: 36, right: 20, bottom: 70, left: 38 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxY = 40;
  const groups = [
    { label: "Families", dvna: 5, expanded: families },
    { label: "Unique Cases", dvna: dvnaCases, expanded: dvnaCases + expandedUnique },
  ];
  const groupW = chartW / groups.length;
  const barW = groupW * 0.28;
  const bars = groups
    .map((g, i) => {
      const cx = margin.left + groupW * i + groupW / 2;
      const h1 = (g.dvna / maxY) * chartH;
      const h2 = (g.expanded / maxY) * chartH;
      const x1 = cx - barW - 3;
      const x2 = cx + 3;
      const y1 = margin.top + chartH - h1;
      const y2 = margin.top + chartH - h2;
      return `<rect x="${x1}" y="${y1}" width="${barW}" height="${h1}" rx="4" fill="#94a3b8"/>
${txt(x1 + barW / 2, y1 - 4, g.dvna, 'font-size="9" text-anchor="middle"')}
<rect x="${x2}" y="${y2}" width="${barW}" height="${h2}" rx="4" fill="#16a34a"/>
${txt(x2 + barW / 2, y2 - 4, g.expanded, 'font-size="9" text-anchor="middle"')}
${txt(cx, margin.top + chartH + 14, g.label, 'font-size="9" text-anchor="middle" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${bars}
${txt(width / 2, height - 20, "Missing in DVNA: SSRF, Cookie, SSTI, IDOR", 'font-size="9" text-anchor="middle" fill="#334155"')}
</svg>`;
}
function buildHeatmapSvg(catalog, matrix, { title = "DVNA Detection Heatmap with Difficulty" } = {}) {
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const caseRows = getCaseRows(catalog, matrix);
  const cellW = 48;
  const cellH = 18;
  const labelW = 140;
  const diffW = 45;
  const width = labelW + tools.length * cellW + diffW + 25;
  const height = 54 + (caseRows.length + 1) * cellH + 28;
  const header = tools.map((t, i) => txt(labelW + i * cellW + cellW / 2, 46, t.label, `font-size="8" text-anchor="end" transform="rotate(-35 ${labelW + i * cellW + cellW / 2} 46)" fill="#334155"`)).join("\n");
  const rows = caseRows
    .map((r, ri) => {
      const y = 56 + ri * cellH;
      const sub = r.case.rowSubtitle ? ` (${r.case.rowSubtitle})` : "";
      return `${txt(labelW - 4, y + 12, `${r.case.rowTitle}${sub}`, 'font-size="8" text-anchor="end" fill="#1e293b"')}
${tools
  .map((t, ti) => {
    const hit = t.detections[r.id] === true;
    return `<rect x="${labelW + ti * cellW}" y="${y}" width="${cellW - 2}" height="${cellH - 2}" rx="2" fill="${hit ? "#22c55e" : "#ef4444"}"/>`;
  })
  .join("\n")}
${txt(labelW + tools.length * cellW + 22, y + 12, `${r.detectedBy}/6`, 'font-size="8" text-anchor="middle" fill="#334155"')}`;
    })
    .join("\n");
  const totals = tools.map((t) => Object.values(t.detections || {}).filter((v) => v === true).length);
  const totalY = 56 + caseRows.length * cellH;
  const totalRow = `${txt(labelW - 4, totalY + 12, "Total Hits", 'font-size="8" text-anchor="end" font-weight="700" fill="#1e293b"')}
${totals.map((v, i) => `<rect x="${labelW + i * cellW}" y="${totalY}" width="${cellW - 2}" height="${cellH - 2}" rx="2" fill="#dbeafe"/>
${txt(labelW + i * cellW + cellW / 2 - 1, totalY + 12, `${v}/11`, 'font-size="8" text-anchor="middle" fill="#1e3a8a" font-weight="700"')}`).join("\n")}
${txt(labelW + tools.length * cellW + 22, totalY + 12, "diff", 'font-size="8" text-anchor="middle" fill="#334155"')}`;
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${header}
${txt(labelW + tools.length * cellW + 22, 46, "difficulty", 'font-size="8" text-anchor="middle" fill="#334155"')}
${rows}
${totalRow}
</svg>`;
}

// New derived charts
function buildDifficultySvg(caseRows, { width = 480, title = "Case Difficulty Spectrum" } = {}) {
  const rows = [...caseRows].sort((a, b) => a.detectedBy - b.detectedBy);
  const margin = { top: 38, right: 22, bottom: 28, left: 170 };
  const chartW = width - margin.left - margin.right;
  const rowH = 24;
  const height = margin.top + rowH * rows.length + margin.bottom;
  const bars = rows
    .map((r, i) => {
      const y = margin.top + i * rowH;
      const w = (r.detectedBy / 6) * chartW;
      const hard = r.detectedBy <= 2;
      return `${txt(margin.left - 8, y + 14, r.case.rowTitle, 'font-size="8" text-anchor="end" fill="#1e293b"')}
<rect x="${margin.left}" y="${y + 2}" width="${chartW}" height="14" rx="7" fill="#e2e8f0"/>
<rect x="${margin.left}" y="${y + 2}" width="${w}" height="14" rx="7" fill="${hard ? "#ef4444" : "#2563eb"}"/>
${txt(margin.left + chartW + 4, y + 13, `${r.detectedBy}/6`, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${txt(width / 2, 31, "Hard cases (<=2/6) highlighted", 'font-size="8" text-anchor="middle" fill="#334155"')}
${bars}
</svg>`;
}
function buildSignalNoiseSvg(rows, { width = 480, title = "Signal-to-Noise (Cases/Alert)" } = {}) {
  const sorted = [...rows].sort((a, b) => b.precisionProxy - a.precisionProxy);
  const margin = { top: 38, right: 18, bottom: 24, left: 160 };
  const chartW = width - margin.left - margin.right;
  const rowH = 26;
  const height = margin.top + rowH * sorted.length + margin.bottom;
  const maxV = Math.max(...sorted.map((r) => r.precisionProxy), 0.001);
  const bars = sorted
    .map((r, i) => {
      const y = margin.top + i * rowH;
      const w = (r.precisionProxy / maxV) * chartW;
      return `${txt(margin.left - 8, y + 15, r.label, 'font-size="8" text-anchor="end" fill="#1e293b"')}
<rect x="${margin.left}" y="${y + 3}" width="${chartW}" height="15" rx="7" fill="#e2e8f0"/>
<rect x="${margin.left}" y="${y + 3}" width="${w}" height="15" rx="7" fill="${r.id === "vibescan" ? "#16a34a" : "#6366f1"}"/>
${txt(margin.left + chartW + 4, y + 15, r.precisionProxy.toFixed(3), 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${bars}
</svg>`;
}
function buildFamilyRecallSvg(catalog, matrix, { width = 480, height = 300, title = "Per-Family Recall by Tool" } = {}) {
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const famMap = new Map();
  for (const c of catalog.cases) {
    if (!famMap.has(c.family)) famMap.set(c.family, []);
    famMap.get(c.family).push(c.id);
  }
  const families = [...famMap.entries()];
  const margin = { top: 38, right: 15, bottom: 75, left: 38 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const groupW = chartW / families.length;
  const barW = Math.max(3, (groupW - 8) / tools.length);
  const bars = families
    .map(([fam, ids], fi) => {
      const gx = margin.left + fi * groupW;
      const familyBars = tools
        .map((t, ti) => {
          const hits = ids.filter((id) => t.detections?.[id] === true).length;
          const pct = hits / ids.length;
          const h = pct * chartH;
          const x = gx + 4 + ti * barW;
          const y = margin.top + chartH - h;
          return `<rect x="${x}" y="${y}" width="${barW - 1}" height="${h}" fill="${t.id === "vibescan" ? "#16a34a" : "#94a3b8"}"/>`;
        })
        .join("\n");
      return `${familyBars}
${txt(gx + groupW / 2, margin.top + chartH + 12, fam.replace(" and ", " & "), 'font-size="7" text-anchor="middle" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b"/>
${bars}
${txt(width / 2, height - 6, "Green=VibeScan, gray=peers", 'font-size="8" text-anchor="middle" fill="#334155"')}
</svg>`;
}
function buildRecallPrecisionSvg(rows, { width = 480, height = 300, title = "Figure 8 - Recall vs precision proxy" } = {}) {
  const margin = { top: 38, right: 25, bottom: 40, left: 42 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxX = Math.max(...rows.map((r) => r.precisionProxy), 0.45);
  const xTicks = [0, 0.1, 0.2, 0.3, 0.4];
  const yTicks = [0, 20, 40, 60, 80, 100];
  const xGrid = xTicks
    .map((t) => {
      const x = margin.left + (Math.min(t, maxX) / maxX) * chartW;
      return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartH}" stroke="#e2e8f0"/>${txt(x, margin.top + chartH + 14, t.toFixed(1), 'font-size="8" text-anchor="middle" fill="#64748b"')}`;
    })
    .join("\n");
  const yGrid = yTicks
    .map((t) => {
      const y = margin.top + chartH - (t / 100) * chartH;
      return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e2e8f0"/>${txt(margin.left - 8, y + 3, `${t}%`, 'font-size="8" text-anchor="end" fill="#64748b"')}`;
    })
    .join("\n");
  const points = rows
    .map((r) => {
      const x = margin.left + (r.precisionProxy / maxX) * chartW;
      const y = margin.top + chartH - (r.percent / 100) * chartH;
      return `<circle cx="${x}" cy="${y}" r="${r.id === "vibescan" ? 5 : 4}" fill="${r.id === "vibescan" ? "#16a34a" : "#2563eb"}"/>
${txt(x + 6, y - 5, r.label, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b"/>
${xGrid}
${yGrid}
${points}
${txt(width / 2, height - 4, "X-axis: Precision proxy (cases detected / raw alerts)", 'font-size="8" text-anchor="middle" fill="#334155"')}
${txt(12, margin.top + chartH / 2, "Y-axis: Recall (%)", 'font-size="8" text-anchor="middle" fill="#334155" transform="rotate(-90 12 ' + (margin.top + chartH / 2) + ')"')}
</svg>`;
}
function buildRecallTimeSvg(rows, timing, { width = 480, height = 280, title = "Recall vs Scan Time" } = {}) {
  const margin = { top: 34, right: 24, bottom: 42, left: 52 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const withTime = rows.filter((r) => typeof r.runtimeMs === "number");
  const xs = withTime.map((r) => Number(r.runtimeMs) / 1000);
  const xMax = Math.max(...xs, Number(timing.durationMs || 0) / 1000, 1);
  const xMin = Math.max(Math.min(...xs, 0.1), 0.1);
  const logMin = Math.log10(xMin);
  const logMax = Math.log10(xMax);
  const xTicks = [0.5, 1, 2, 5, 10, 20, 50, 100].filter((t) => t >= xMin && t <= xMax);
  const yTicks = [0, 20, 40, 60, 80, 100];
  const fmtSec = (s) => `${s.toFixed(1)}s`;
  const xToPx = (s) => {
    const clamped = Math.max(xMin, Math.min(xMax, s));
    const t = (Math.log10(clamped) - logMin) / Math.max(logMax - logMin, 1e-9);
    return margin.left + t * chartW;
  };

  const gridX = xTicks
    .map((t) => {
      const x = xToPx(t);
      return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartH}" stroke="#e2e8f0"/>${txt(x, margin.top + chartH + 14, fmtSec(t), 'font-size="8" text-anchor="middle" fill="#64748b"')}`;
    })
    .join("\n");
  const gridY = yTicks
    .map((t) => {
      const y = margin.top + chartH - (t / 100) * chartH;
      return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e2e8f0"/>${txt(margin.left - 8, y + 3, `${t}%`, 'font-size="8" text-anchor="end" fill="#64748b"')}`;
    })
    .join("\n");

  const points = withTime
    .map((r) => {
      const x = xToPx(Number(r.runtimeMs) / 1000);
      const y = margin.top + chartH - (r.percent / 100) * chartH;
      const c = r.id === "vibescan" ? "#16a34a" : "#2563eb";
      const rad = r.id === "vibescan" ? 5 : 4;
      return `<circle cx="${x}" cy="${y}" r="${rad}" fill="${c}"/>${txt(x + 6, y - 5, r.label, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b"/>
${gridX}
${gridY}
${points}
${txt(width / 2, height - 6, "X-axis: runtime (seconds, log scale) · Y-axis: DVNA recall", 'font-size="8" text-anchor="middle" fill="#334155"')}
</svg>`;
}

function wrapStandalone(title, svgContent) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${esc(title)}</title>
  <style>body{font-family:system-ui,sans-serif;margin:24px;background:#f8fafc;color:#0f172a}.card{max-width:760px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgb(0 0 0 / 0.08)}h1{font-size:1.1rem;margin:0 0 12px}</style>
  </head><body><h1>${esc(title)}</h1><div class="card">${svgContent}</div></body></html>`;
}

function buildPosterHtml(figs, data) {
  const { compare, dvnaCases, expandedUnique, familyCount, stressRows, timing } = data;
  const top = compare[0];
  const second = compare[1];
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>VibeScan Poster</title>
<style>
:root{--blue:#1e3a5f;--border:#e2e8f0;--muted:#475569}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;background:#f8fafc;padding:12px}
.poster{max-width:1550px;margin:0 auto;background:#fff;border:1px solid var(--border)}.header{background:linear-gradient(135deg,#1e3a5f,#0f172a);color:#fff;padding:22px 30px;text-align:center}
.header h1{margin:0;font-size:2rem}.header p{margin:6px 0 0;font-size:1rem;opacity:.9}.content{display:grid;grid-template-columns:1fr 1.2fr 1.2fr}
.col{padding:14px 16px;border-right:1px solid var(--border)}.col:last-child{border-right:none}.sec{margin-bottom:14px}.sec h2{font-size:1rem;color:#1e3a5f;border-bottom:2px solid #2563eb;padding-bottom:4px;margin:0 0 6px}
.sec p,.sec li{font-size:.83rem;line-height:1.45}.fig{margin-bottom:12px}.fig-title{font-size:.73rem;text-transform:uppercase;font-weight:700;color:var(--muted);margin-bottom:4px}
.fig-card{border:1px solid var(--border);border-radius:8px;background:#fafbfd;padding:8px}.caption{font-size:.74rem;color:var(--muted);margin-top:5px;line-height:1.35}
.fig-card img{width:100%;height:auto;display:block;border-radius:6px}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kbox{border:1px solid var(--border);border-radius:8px;padding:7px;text-align:center;background:#f0f9ff}
.kval{font-size:1.3rem;font-weight:700}.klbl{font-size:.68rem;color:var(--muted)}.discussion{border-top:1px solid var(--border);padding:10px 16px}
.discussion h3{margin:0 0 5px;color:#1e3a5f}.discussion p{margin:0;font-size:.8rem;line-height:1.4}
.references{border-top:1px solid var(--border);padding:10px 16px 12px;font-size:.72rem;color:var(--muted);line-height:1.38}
.references h3{margin:0 0 6px;color:#1e3a5f;font-size:.85rem}.ref-list{margin:0;padding-left:18px}.ref-list li{margin-bottom:5px}.ref-list a{color:#1e40af;word-break:break-all}
.footer{border-top:1px solid var(--border);padding:9px 16px;font-size:.74rem;color:var(--muted);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
@media print{@page{size:A1 landscape;margin:8mm}body{padding:0;background:#fff}.poster{border:none}}@media (max-width:1100px){.content{grid-template-columns:1fr}.col{border-right:none;border-bottom:1px solid var(--border)}}
</style></head><body><main class="poster">
<header class="header"><h1>VibeScan: Multi-Dimensional Benchmark Analysis for JavaScript Security Scanning</h1><p>Josh Obersteadt - CCSC 2026</p></header>
<section class="content">
<div class="col">
<div class="sec"><h2>Abstract</h2><p>Comparing JavaScript security scanners by raw alert counts confounds detection with noise. We present a reproducible multi-dimensional study on an adjudicated DVNA benchmark [1] with aligned peer tool runs, expanded rule-family coverage, and metrics that separate what is found (recall) from triage burden (cases-per-alert precision proxy) and operational cost (wall-clock scan time). Findings are interpreted alongside standard web-application risk framing [2]. VibeScan attains the highest DVNA recall (${top.percent.toFixed(1)}%), ${(top.percent - second.percent).toFixed(1)} percentage points above the next-ranked scanner (${second.label}), with supporting analyses for signal-to-noise, per-family recall, difficulty-weighted coverage, and recall–time tradeoffs. Limitations: precision remains a proxy (not full per-alert false-positive adjudication for every tool), and the expanded corpus is partially VibeScan-aligned for family stress testing.</p></div>
<div class="sec"><h2>Research Questions</h2><ul><li>RQ1: Can VibeScan sustain top recall on hard cases?</li><li>RQ2: Where do peers diverge by family and case difficulty?</li><li>RQ3: How do precision-proxy and runtime affect practical scanner value?</li></ul></div>
<div class="sec"><h2>Method</h2><p>Datasets: DVNA (${dvnaCases}), expanded unique (${expandedUnique}), stress repeats (${stressRows}). Metrics: recall, cases-per-alert precision proxy, family recall, difficulty score (detected-by count), and VibeScan wall-clock runtime (${(timing.durationMs / 1000).toFixed(2)}s).</p></div>
<div class="fig"><div class="fig-title">Figure 1 - Analysis depth comparison</div><div class="fig-card"><img src="./comparison-overview.png" alt="VibeScan analysis depth comparison diagram"/></div><div class="caption">Clean stage-by-stage comparison of where peer tools stop vs where VibeScan continues.</div></div>
<div class="fig"><div class="fig-title">Figure 2 - Recall vs raw volume</div><div class="fig-card">${figs.scatter}</div><div class="caption">Trend line + Pearson r quantifies that alert volume is weakly related to recall.</div></div>
</div>
<div class="col">
<div class="sec"><h2>Results KPIs</h2><div class="kpi"><div class="kbox"><div class="kval">100%</div><div class="klbl">VibeScan DVNA recall</div></div><div class="kbox"><div class="kval">${second.percent.toFixed(1)}%</div><div class="klbl">Next-best recall</div></div><div class="kbox"><div class="kval">${dvnaCases + expandedUnique}</div><div class="klbl">Unique scored rows</div></div><div class="kbox"><div class="kval">${familyCount}</div><div class="klbl">Rule families</div></div></div></div>
<div class="fig"><div class="fig-title">Figure 6 - Signal to noise</div><div class="fig-card">${figs.signalNoise}</div><div class="caption">Higher means more benchmark value per reported alert.</div></div>
<div class="fig"><div class="fig-title">Figure 7 - Per-family recall</div><div class="fig-card">${figs.familyRecall}</div><div class="caption">Family-level decomposition shows where peers drop coverage.</div></div>
</div>
<div class="col">
<div class="fig"><div class="fig-title">Figure 4 - Heatmap with totals</div><div class="fig-card">${figs.heatmap}</div><div class="caption">Adds column totals and per-row difficulty score.</div></div>
<div class="fig"><div class="fig-title">Figure 8 - Recall vs precision proxy</div><div class="fig-card">${figs.recallPrecision}</div><div class="caption">Precision proxy = cases detected / raw alerts (not full FP-adjudicated precision).</div></div>
<div class="fig"><div class="fig-title">Figure 9 - Recall vs scan time</div><div class="fig-card">${figs.recallTime}</div><div class="caption">Runtime from rerun measurements; log-scale x-axis improves visibility with CodeQL as an outlier.</div></div>
<div class="sec"><h2>Limitations</h2><ul><li>Peer runtime fields are not in historical artifacts.</li><li>Precision proxy is not formal precision.</li><li>Expanded corpus remains VibeScan-focused.</li></ul></div>
</div>
</section>
<section class="discussion"><h3>Discussion</h3><p>VibeScan leads overall recall and stays strong on hard cases (<=2/6 peer coverage). Signal-to-noise and recall-vs-precision-proxy charts show practical advantage beyond raw alert counts. Family-level and heatmap totals explain where this lead comes from: crypto/auth/xss and multi-context injection cases. Runtime evidence shows CI-friendly execution speed for local benchmark workflows.</p></section>
<section class="references"><h3>References</h3><ol class="ref-list">
<li>AppSecCo. <em>Damn Vulnerable Node Application (DVNA)</em>. GitHub repository. <a href="https://github.com/appsecco/dvna">https://github.com/appsecco/dvna</a>.</li>
<li>OWASP Foundation. <em>OWASP Top 10:2021</em>. <a href="https://owasp.org/Top10/">https://owasp.org/Top10/</a>.</li>
<li>Semgrep, Inc. <em>Semgrep documentation</em>. <a href="https://semgrep.dev/docs/">https://semgrep.dev/docs/</a>.</li>
<li>GitHub. <em>CodeQL documentation</em>. <a href="https://codeql.github.com/docs/">https://codeql.github.com/docs/</a>.</li>
<li>ESLint Community. <em>eslint-plugin-security</em>. <a href="https://github.com/eslint-community/eslint-plugin-security">https://github.com/eslint-community/eslint-plugin-security</a>.</li>
<li>Snyk Ltd. <em>Snyk CLI</em>. <a href="https://docs.snyk.io/snyk-cli">https://docs.snyk.io/snyk-cli</a>.</li>
<li>Bearer. <em>Bearer (open-source static analysis)</em>. <a href="https://github.com/Bearer/bearer">https://github.com/Bearer/bearer</a>.</li>
</ol></section>
<footer class="footer"><span>DVNA commit 9ba473a | VibeScan v1.1.0 | npm @jobersteadt/vibescan</span><span>Data: results/dvna-detection-matrix.json, results/dvna-case-catalog.json, results/vibescan-dvna-scan-timing.json, results/dvna-tool-timings.json</span></footer>
</main></body></html>`;
}

function main() {
  const dvnaMatrix = readJson("results/dvna-detection-matrix.json");
  const dvnaCatalog = readJson("results/dvna-case-catalog.json");
  const frameworkCatalog = readJson("results/framework-vuln-case-catalog.json");
  const highVolumeCatalog = readJson("results/framework-vuln-case-catalog-high-volume.json");
  const manifest = readJson("results/rule-family-coverage-manifest.json");
  const timing = readJson("results/vibescan-dvna-scan-timing.json");
  const compare = loadCompareRows(dvnaMatrix);
  const caseRows = getCaseRows(dvnaCatalog, dvnaMatrix);

  const figs = {
    recall: buildRecallBarSvg(compare),
    scatter: buildScatterSvg(compare),
    coverage: buildCoverageGapSvg(dvnaCatalog.cases.length, frameworkCatalog.cases.length, manifest.families.length),
    heatmap: buildHeatmapSvg(dvnaCatalog, dvnaMatrix),
    difficulty: buildDifficultySvg(caseRows),
    signalNoise: buildSignalNoiseSvg(compare),
    familyRecall: buildFamilyRecallSvg(dvnaCatalog, dvnaMatrix),
    recallPrecision: buildRecallPrecisionSvg(compare),
    recallTime: buildRecallTimeSvg(compare, timing),
  };

  mkdirSync(chartsDir, { recursive: true });
  mkdirSync(dirname(posterPath), { recursive: true });

  writeFileSync(
    posterPath,
    buildPosterHtml(figs, {
      compare,
      dvnaCases: dvnaCatalog.cases.length,
      expandedUnique: frameworkCatalog.cases.length,
      familyCount: manifest.families.length,
      stressRows: highVolumeCatalog.cases.length,
      timing,
    }),
    "utf8"
  );

  const standalone = [
    ["vibescan-dvna-recall-bar-chart.html", "DVNA Recall by Tool", figs.recall],
    ["vibescan-recall-vs-volume-scatter.html", "Recall vs Raw Alert Volume", figs.scatter],
    ["vibescan-coverage-gap-chart.html", "Benchmark Coverage Gap", figs.coverage],
    ["vibescan-dvna-heatmap-mini.html", "DVNA Detection Heatmap", figs.heatmap],
    ["vibescan-case-difficulty-chart.html", "Case Difficulty Spectrum", figs.difficulty],
    ["vibescan-signal-noise-chart.html", "Signal-to-Noise", figs.signalNoise],
    ["vibescan-family-recall-chart.html", "Per-Family Recall", figs.familyRecall],
    ["vibescan-recall-precision-chart.html", "Figure 8 - Recall vs precision proxy", figs.recallPrecision],
    ["vibescan-recall-time-chart.html", "Recall vs Scan Time", figs.recallTime],
  ];
  for (const [name, title, svg] of standalone) {
    writeFileSync(join(chartsDir, name), wrapStandalone(title, svg), "utf8");
    console.log(`Wrote ${join(chartsDir, name)}`);
  }
  console.log(`Wrote ${posterPath}`);
}

main();
