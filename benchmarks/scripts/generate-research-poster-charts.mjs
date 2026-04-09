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
const TOOL_COLORS = {
  // High-contrast, colorblind-friendlier palette (Okabe-Ito inspired). Keys = matrix tool ids.
  vibescan: "#009E73",
  bearer: "#0072B2",
  "snyk-code": "#E69F00",
  codeql: "#CC79A7",
  semgrep: "#D55E00",
  "eslint-security": "#56B4E9",
};
function colorForTool(id, fallback = "#64748b") {
  if (!id) return fallback;
  if (TOOL_COLORS[id]) return TOOL_COLORS[id];
  const legacy = { snyk: "snyk-code", eslint_security: "eslint-security" };
  const canon = legacy[id];
  return (canon && TOOL_COLORS[canon]) || fallback;
}
function getLegendTools(matrix) {
  return matrix.tools.filter((t) => t.chartMode !== "gap");
}
function legendSvg(items, x, y) {
  return items
    .map((item, i) => {
      const yy = y + i * 14;
      return `<rect x="${x}" y="${yy - 7}" width="8" height="8" rx="2" fill="${item.color}"/>${txt(x + 12, yy, item.label, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
}
function buildGlobalToolLegendHtml(tools) {
  const items = tools
    .map(
      (t, i) =>
        `<div class="tool-legend-item" title="${esc(t.label)}"><span class="tool-num" aria-hidden="true">${i + 1}</span><span class="tool-swatch" style="background:${colorForTool(t.id)}"></span><span class="tool-name">${esc(t.label)}</span></div>`
    )
    .join("");
  return `<aside class="tool-legend-wrap" aria-label="Tool color key (1–6)">
<div class="tool-legend-heading">Tool color key — columns 1–6 match matrix and point colors in Figures 2, 8, and 9</div>
<div class="tool-legend">${items}</div>
<p class="tool-legend-note">Swatches = tool for scatter plots below. The detection matrix uses \u2713/\u2717 per cell (not swatches).</p>
</aside>`;
}
function invNormCdf(p) {
  // Acklam inverse-normal approximation; adequate for presentation metrics.
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p <= 0 || p >= 1) throw new RangeError("invNormCdf expects p in (0, 1)");
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= phigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
function etsdDeltaFromP(p, n) {
  // Prevent infinities at p=0 or p=1 with finite-sample continuity correction.
  const minP = 1 / (2 * n);
  const maxP = 1 - minP;
  const pAdj = Math.max(minP, Math.min(maxP, p));
  const z = invNormCdf(pAdj);
  return 13 - 4 * z;
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
  const toolCount = tools.length;
  return order.map((id) => {
    const c = byId.get(id);
    const detections = tools.map((t) => (t.detections?.[id] === true ? 1 : 0));
    const detectedBy = detections.reduce((s, n) => s + n, 0);
    const pValue = toolCount > 0 ? detectedBy / toolCount : 0;
    const delta = toolCount > 0 ? etsdDeltaFromP(pValue, toolCount) : 13;
    return { id, case: c, detectedBy, toolCount, pValue, delta };
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
      const color = colorForTool(row.id);
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
  const margin = { top: 36, right: 30, bottom: 52, left: 46 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const xs = rows.map((r) => r.rawIssues);
  const ys = rows.map((r) => r.percent);
  const r = pearson(xs, ys);
  const xLog = (v) => Math.log10(v + 1);
  const lxVals = xs.map(xLog);
  let lxMin = Math.min(...lxVals);
  let lxMax = Math.max(...lxVals);
  const pad = Math.max((lxMax - lxMin) * 0.08, 0.12);
  lxMin = Math.max(0, lxMin - pad);
  lxMax = lxMax + pad;
  const lxSpan = Math.max(lxMax - lxMin, 1e-9);
  const xToPx = (raw) => margin.left + ((xLog(raw) - lxMin) / lxSpan) * chartW;
  const tickCandidates = [0, 1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000];
  const xTicks = tickCandidates.filter((t) => {
    const lx = xLog(t);
    return lx >= lxMin - 1e-9 && lx <= lxMax + 1e-9;
  });
  const yTicks = [0, 20, 40, 60, 80, 100];
  const pts = rows
    .map((row) => {
      const x = xToPx(row.rawIssues);
      const y = margin.top + chartH - (row.percent / 100) * chartH;
      const color = colorForTool(row.id, "#2563eb");
      return `<circle cx="${x}" cy="${y}" r="${row.id === "vibescan" ? 5 : 4}" fill="${color}" opacity="0.85"/>
${txt(x + 7, y - 5, row.label, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${txt(width - 10, 30, `Pearson r=${r.toFixed(2)} (linear)`, 'font-size="9" text-anchor="end" fill="#334155"')}
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#64748b"/>
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#64748b"/>
${xTicks
  .map((t) => {
    const x = xToPx(t);
    return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartH}" stroke="#eef2f7"/>
${txt(x, height - 28, t, 'font-size="8" text-anchor="middle" fill="#64748b"')}`;
  })
  .join("\n")}
${yTicks
  .map((t) => {
    const y = margin.top + chartH - (t / 100) * chartH;
    return `<line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#eef2f7"/>
${txt(margin.left - 5, y + 3, t, 'font-size="8" text-anchor="end" fill="#64748b"')}`;
  })
  .join("\n")}
${pts}
${txt(12, margin.top + chartH / 2, "Y: Recall (%)", 'font-size="9" text-anchor="middle" fill="#334155" transform="rotate(-90 12 ' + (margin.top + chartH / 2) + ')"')}
${txt(width / 2, height - 8, "X: Raw issue count on DVNA (log\u2081\u2080(x+1) scale)", 'font-size="9" text-anchor="middle" fill="#334155"')}
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
function heatmapToolAbbr(t) {
  switch (t.id) {
    case "vibescan":
      return "VibeScan";
    case "bearer":
      return "Bearer";
    case "snyk-code":
      return "Snyk";
    case "semgrep":
      return "Semgrep";
    case "codeql":
      return "CodeQL";
    case "eslint-security":
    case "eslint_security":
      return "ESLint";
    default:
      return t.label.length > 8 ? `${t.label.slice(0, 7)}…` : t.label;
  }
}
function heatmapCaseLabel(r, maxLen = 36) {
  const sub = r.case.rowSubtitle ? ` — ${r.case.rowSubtitle}` : "";
  const full = `${r.case.rowTitle}${sub}`;
  return full.length > maxLen ? `${full.slice(0, maxLen - 1)}…` : full;
}
const HEATMAP_FAMILY_ABBREV = {
  "Redirect and Navigation": "Redirect & Nav.",
  "Secrets and Crypto": "Secrets & Crypto",
  "Auth and Access Control": "Auth & Access",
  "XSS and Client-Side Output": "XSS & Client-side",
};
function heatmapFamilyLabel(family, maxLen = 24) {
  if (!family) return "—";
  const s = HEATMAP_FAMILY_ABBREV[family] || family;
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
}
/** Stable sort: families follow first appearance in catalog.caseOrder; cases keep catalog order within a family. */
function orderCaseRowsByFamily(caseRows, catalog) {
  const order = catalog.caseOrder || [];
  const familyOrder = [];
  const seen = new Set();
  for (const id of order) {
    const row = caseRows.find((r) => r.id === id);
    if (!row?.case?.family) continue;
    const f = row.case.family;
    if (!seen.has(f)) {
      seen.add(f);
      familyOrder.push(f);
    }
  }
  const rank = new Map(familyOrder.map((f, i) => [f, i]));
  const idx = (id) => order.indexOf(id);
  return [...caseRows].sort((a, b) => {
    const fa = rank.get(a.case.family) ?? 999;
    const fb = rank.get(b.case.family) ?? 999;
    if (fa !== fb) return fa - fb;
    return idx(a.id) - idx(b.id);
  });
}
function buildHeatmapSvg(catalog, matrix, { title = "DVNA: detection by case", variant = "default" } = {}) {
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const caseRows = orderCaseRowsByFamily(getCaseRows(catalog, matrix), catalog);
  const L =
    variant === "poster"
      ? {
          cellW: 82,
          cellH: 21,
          familyColW: 64,
          caseLabelW: 120,
          diffW: 36,
          padR: 14,
          topPad: 6,
          titleY: 14,
          subY: 26,
          headerTop: 38,
          stripH: 5,
          gridTop: 64,
          headerLabelY: 51,
          legendGap: 6,
          legendLineGap: 11,
          fsTitle: 10,
          fsSub: 6.3,
          fsColNum: 6,
          fsColAbbr: 6.5,
          fsFam: 5.5,
          fsCase: 6.2,
          fsSym: 10,
          fsDelta: 7.5,
          fsTotLbl: 7,
          fsHits: 8,
          fsDiffH: 7.5,
          fsDiffSub: 6,
          fsLeg1: 6.2,
          fsLeg2: 6,
          caseMaxLen: 28,
          famMaxLen: 20,
          rowFamDy: 7,
          rowCaseDy: 16,
          symDy: 4,
          subLine:
            "Rows: DVNA by family (top\u2192bottom); cols: tools 1\u20136. Left = family, then case name.",
        }
      : {
          cellW: 54,
          cellH: 28,
          familyColW: 82,
          caseLabelW: 158,
          diffW: 52,
          padR: 20,
          topPad: 8,
          titleY: 22,
          subY: 38,
          headerTop: 48,
          stripH: 6,
          gridTop: 82,
          headerLabelY: 66,
          legendGap: 10,
          legendLineGap: 14,
          fsTitle: 12,
          fsSub: 7.5,
          fsColNum: 7,
          fsColAbbr: 7.5,
          fsFam: 7,
          fsCase: 7.5,
          fsSym: 12,
          fsDelta: 9,
          fsTotLbl: 8,
          fsHits: 9,
          fsDiffH: 8,
          fsDiffSub: 7,
          fsLeg1: 7.5,
          fsLeg2: 7,
          caseMaxLen: 36,
          famMaxLen: 24,
          rowFamDy: 10,
          rowCaseDy: 21,
          symDy: 5,
          subLine:
            "Rows = DVNA scenarios grouped by rule family (top\u2192bottom); left column = family, next column = case. Columns = tools 1\u20136.",
        };
  const { cellW, cellH, familyColW, caseLabelW, diffW, padR, topPad, subLine, gridTop, headerLabelY } = L;
  const labelW = familyColW + caseLabelW;
  const width = labelW + tools.length * cellW + diffW + padR;
  const bodyH = (caseRows.length + 1) * cellH;
  const legendY = gridTop + bodyH + L.legendGap;
  const height = legendY + L.legendLineGap + 22 + topPad;
  const gridW = tools.length * cellW;

  const toolKey = tools.map((t, i) => `${i + 1}:${heatmapToolAbbr(t)}`).join(" · ");

  const columnColorStrips = tools
    .map((t, i) => {
      const x = labelW + i * cellW;
      return `<rect x="${x + 2}" y="${L.headerTop}" width="${cellW - 4}" height="${L.stripH}" rx="1.5" fill="${colorForTool(t.id)}"/>`;
    })
    .join("\n");

  const columnHeaders = tools
    .map((t, i) => {
      const cx = labelW + i * cellW + cellW / 2;
      const ab = heatmapToolAbbr(t);
      const numOff = variant === "poster" ? 3 : 4;
      const abOff = variant === "poster" ? 7 : 8;
      return `${txt(cx, headerLabelY - numOff, String(i + 1), `font-size="${L.fsColNum}" font-weight="800" text-anchor="middle" fill="#64748b"`)}
${txt(cx, headerLabelY + abOff, ab, `font-size="${L.fsColAbbr}" font-weight="700" text-anchor="middle" fill="#0f172a"`)}`;
    })
    .join("\n");

  const rows = caseRows
    .map((r, ri) => {
      const y = gridTop + ri * cellH;
      const stripe =
        ri % 2 === 0
          ? `<rect x="0" y="${y}" width="${width}" height="${cellH}" fill="#f1f5f9" opacity="0.65"/>`
          : "";
      const lab = heatmapCaseLabel(r, L.caseMaxLen);
      const fam = heatmapFamilyLabel(r.case.family, L.famMaxLen);
      const rowLabel = `${txt(familyColW - 4, y + L.rowFamDy, fam, `font-size="${L.fsFam}" font-weight="600" text-anchor="end" fill="#475569"`)}
${txt(labelW - 6, y + L.rowCaseDy, lab, `font-size="${L.fsCase}" text-anchor="end" fill="#0f172a"`)}`;
      const cells = tools
        .map((t, ti) => {
          const hit = t.detections[r.id] === true;
          const x = labelW + ti * cellW;
          const sym = hit ? "\u2713" : "\u2717";
          const fill = hit ? "#15803d" : "#b91c1c";
          const rxOuter = variant === "poster" ? 2 : 3;
          const rxInner = variant === "poster" ? 1.5 : 2;
          return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellW - 1}" height="${cellH - 1}" rx="${rxOuter}" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
<rect x="${x + 2}" y="${y + 2}" width="${cellW - 4}" height="${cellH - 4}" rx="${rxInner}" fill="${fill}" opacity="0.92"/>
${txt(x + cellW / 2, y + cellH / 2 + L.symDy, sym, `font-size="${L.fsSym}" text-anchor="middle" fill="#ffffff" font-weight="700"`)}`;
        })
        .join("\n");
      const dx = txt(
        labelW + gridW + diffW / 2,
        y + cellH / 2 + 3,
        r.delta.toFixed(1),
        `font-size="${L.fsDelta}" text-anchor="middle" fill="#334155" font-weight="600"`
      );
      return `${stripe}${rowLabel}${cells}${dx}`;
    })
    .join("\n");

  const totals = tools.map((t) => Object.values(t.detections || {}).filter((v) => v === true).length);
  const totalY = gridTop + caseRows.length * cellH;
  const totalStripe = `<rect x="0" y="${totalY}" width="${width}" height="${cellH}" fill="#e0f2fe" opacity="0.9"/>`;
  const totalLabel = txt(
    labelW - 6,
    totalY + cellH / 2 + 3,
    "Hits (of 11 cases)",
    `font-size="${L.fsTotLbl}" text-anchor="end" font-weight="700" fill="#0c4a6e"`
  );
  const totalCells = totals
    .map((v, i) => {
      const x = labelW + i * cellW;
      return `<rect x="${x + 0.5}" y="${totalY + 0.5}" width="${cellW - 1}" height="${cellH - 1}" rx="3" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
${txt(x + cellW / 2, totalY + cellH / 2 + 3, `${v}/11`, `font-size="${L.fsHits}" text-anchor="middle" fill="#0c4a6e" font-weight="700"`)}`;
    })
    .join("\n");
  const totalRow = `${totalStripe}${totalLabel}${totalCells}${txt(labelW + gridW + diffW / 2, totalY + cellH / 2 + 3, "\u2014", `font-size="${L.fsHits}" text-anchor="middle" fill="#64748b"`)}`;

  const legend1 = txt(
    width / 2,
    legendY,
    "\u2713 = tool detected this case   ·   \u2717 = missed   ·   Difficulty \u0394 = ETS-style hardness from peer agreement (higher = harder)",
    `font-size="${L.fsLeg1}" text-anchor="middle" fill="#475569"`
  );
  const legend2 = txt(width / 2, legendY + L.legendLineGap, toolKey, `font-size="${L.fsLeg2}" text-anchor="middle" fill="#64748b"`);

  const gridFrame = `<rect x="${labelW}" y="${gridTop}" width="${gridW + diffW}" height="${bodyH}" fill="none" stroke="#cbd5e1" stroke-width="1" rx="3"/>`;

  const diffHeader = `${txt(labelW + gridW + diffW / 2, headerLabelY + 2, "Diff", `font-size="${L.fsDiffH}" font-weight="700" text-anchor="middle" fill="#0f172a"`)}
${txt(labelW + gridW + diffW / 2, headerLabelY + 12, "(\u0394)", `font-size="${L.fsDiffSub}" text-anchor="middle" fill="#64748b"`)}`;

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, L.titleY, title, `font-size="${L.fsTitle}" font-weight="700" text-anchor="middle" fill="#0f172a"`)}
${txt(width / 2, L.subY, subLine, `font-size="${L.fsSub}" text-anchor="middle" fill="#64748b"`)}
${gridFrame}
${columnColorStrips}
${columnHeaders}
${diffHeader}
${rows}
${totalRow}
${legend1}
${legend2}
</svg>`;
}

/** Poster-friendly case×tool view: HTML table (readable when zoomed; avoids tiny SVG text). */
function buildDetectionMatrixTableHtml(catalog, matrix) {
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const caseRows = orderCaseRowsByFamily(getCaseRows(catalog, matrix), catalog);
  const headerTools = tools
    .map((t, i) => {
      const ab = heatmapToolAbbr(t);
      return `<th class="dm-tool" scope="col" style="border-top:3px solid ${colorForTool(t.id)}" title="${esc(t.label)}"><span class="dm-tn">${i + 1}</span><span class="dm-tab">${esc(
        ab
      )}</span></th>`;
    })
    .join("");
  const bodyRows = caseRows
    .map((r, ri) => {
      const fam = heatmapFamilyLabel(r.case.family, 24);
      const lab = heatmapCaseLabel(r, 48);
      const cells = tools
        .map((t) => {
          const hit = t.detections[r.id] === true;
          return hit
            ? `<td class="dm-cell dm-hit" aria-label="detected">\u2713</td>`
            : `<td class="dm-cell dm-miss" aria-label="missed">\u2717</td>`;
        })
        .join("");
      const rowAttr = ri % 2 === 0 ? ' class="dm-row-alt"' : "";
      return `<tr${rowAttr}>
<td class="dm-fam">${esc(fam)}</td>
<td class="dm-case">${esc(lab)}</td>
${cells}
<td class="dm-delta">${r.delta.toFixed(1)}</td>
</tr>`;
    })
    .join("\n");
  const totals = tools
      .map((t) => {
        const hits = Object.values(t.detections || {}).filter((v) => v === true).length;
        return `<td class="dm-cell dm-foot-cell"><strong>${hits}</strong><span class="dm-foot-of">/11</span></td>`;
      })
      .join("");
  return `<div class="detection-matrix-wrap">
<table class="detection-matrix">
<thead>
<tr>
<th scope="colgroup" colspan="2" class="dm-corner">Rule family \xb7 Scenario</th>
${headerTools}
<th scope="col" class="dm-delta-h" title="Difficulty \u0394 (ETS-style; higher = harder)">\u0394</th>
</tr>
</thead>
<tbody>
${bodyRows}
</tbody>
<tfoot>
<tr>
<td colspan="2" class="dm-foot-label">Hits (of 11 cases)</td>
${totals}
<td class="dm-delta dm-foot-dash">\u2014</td>
</tr>
</tfoot>
</table>
<p class="dm-micro">\u2713 = detected · \u2717 = missed · <span class="dm-micro-k">\u0394</span> = case hardness vs peer agreement. Columns 1\u20136 match the tool key above.</p>
</div>`;
}

// New derived charts
function buildDifficultySvg(caseRows, { width = 480, title = "Case Difficulty Spectrum" } = {}) {
  const rows = [...caseRows].sort((a, b) => b.delta - a.delta);
  const margin = { top: 38, right: 22, bottom: 28, left: 170 };
  const chartW = width - margin.left - margin.right;
  const rowH = 24;
  const height = margin.top + rowH * rows.length + margin.bottom;
  const bars = rows
    .map((r, i) => {
      const y = margin.top + i * rowH;
      const w = Math.max(0, Math.min(chartW, ((r.delta - 6) / 14) * chartW));
      const hard = r.detectedBy <= 2;
      return `${txt(margin.left - 8, y + 14, r.case.rowTitle, 'font-size="8" text-anchor="end" fill="#1e293b"')}
<rect x="${margin.left}" y="${y + 2}" width="${chartW}" height="14" rx="7" fill="#e2e8f0"/>
<rect x="${margin.left}" y="${y + 2}" width="${w}" height="14" rx="7" fill="${hard ? "#ef4444" : "#2563eb"}"/>
${txt(margin.left + chartW + 4, y + 13, `${r.delta.toFixed(1)} (${r.detectedBy}/${r.toolCount})`, 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${txt(width / 2, 31, "Hard cases (<=2/6 consensus; higher Δ = harder)", 'font-size="8" text-anchor="middle" fill="#334155"')}
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
<rect x="${margin.left}" y="${y + 3}" width="${w}" height="15" rx="7" fill="${colorForTool(r.id, "#6366f1")}"/>
${txt(margin.left + chartW + 4, y + 15, r.precisionProxy.toFixed(3), 'font-size="8" fill="#334155"')}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(width / 2, 18, title, 'font-size="12" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${bars}
</svg>`;
}
function buildFamilyRecallSvg(catalog, matrix, { title = "Recall by family (% of cases hit)" } = {}) {
  const tools = matrix.tools.filter((t) => t.chartMode !== "gap");
  const famMap = new Map();
  for (const c of catalog.cases) {
    if (!famMap.has(c.family)) famMap.set(c.family, []);
    famMap.get(c.family).push(c.id);
  }
  const families = [...famMap.entries()];
  const cellW = 50;
  const rowH = 26;
  const labelW = 118;
  const headH = 24;
  const pad = 10;
  const titleY = 16;
  const subY = 30;
  const gridTop = 40;
  const nTools = tools.length;
  const nRows = families.length;
  const svgW = labelW + nTools * cellW + pad;
  const footY = gridTop + headH + nRows * rowH + 10;
  const svgH = footY + 18;

  const shortFam = (fam) => {
    const s = fam.replace(" and ", " & ");
    return s.length > 20 ? `${s.slice(0, 19)}…` : s;
  };

  const headerRow = tools
    .map((t, ti) => {
      const x = labelW + ti * cellW;
      return `<rect x="${x + 1}" y="${gridTop}" width="${cellW - 3}" height="6" rx="2" fill="${colorForTool(t.id)}"/>
${txt(x + cellW / 2 - 1, gridTop + 20, String(ti + 1), 'font-size="9" font-weight="800" text-anchor="middle" fill="#475569"')}`;
    })
    .join("\n");

  const dataRows = families
    .map(([fam, ids], ri) => {
      const y = gridTop + headH + ri * rowH;
      const label = `${txt(labelW - 6, y + rowH / 2 + 3, shortFam(fam), 'font-size="8" text-anchor="end" fill="#0f172a"')}`;
      const cells = tools
        .map((t, ti) => {
          const hits = ids.filter((id) => t.detections?.[id] === true).length;
          const denom = ids.length || 1;
          const pct = Math.round((hits / denom) * 100);
          const x = labelW + ti * cellW;
          const tc = colorForTool(t.id);
          const bg =
            pct >= 100 ? `${tc}28` : pct <= 0 ? "#fef2f2" : "#f8fafc";
          const stroke = pct >= 100 ? tc : "#e2e8f0";
          return `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 3}" height="${rowH - 3}" rx="4" fill="${bg}" stroke="${stroke}" stroke-width="${pct >= 100 ? 1.25 : 0.75}" opacity="1"/>
${txt(x + cellW / 2 - 1, y + rowH / 2 + 4, `${pct}%`, `font-size="10" font-weight="700" text-anchor="middle" fill="${pct > 0 ? tc : "#94a3b8"}"`)}`;
        })
        .join("\n");
      return `${label}${cells}`;
    })
    .join("\n");

  return `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" xmlns="http://www.w3.org/2000/svg">
${txt(svgW / 2, titleY, title, 'font-size="11" font-weight="700" text-anchor="middle" fill="#0f172a"')}
${txt(svgW / 2, subY, "Matrix: rows = DVNA family, columns = tools (same order & colors as poster key).", 'font-size="7" text-anchor="middle" fill="#64748b"')}
${headerRow}
${dataRows}
${txt(svgW / 2, footY, "100% = all cases in that family detected; 0% = none.", 'font-size="7" text-anchor="middle" fill="#64748b"')}
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
      return `<circle cx="${x}" cy="${y}" r="${r.id === "vibescan" ? 5 : 4}" fill="${colorForTool(r.id, "#2563eb")}"/>
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
      const c = colorForTool(r.id, "#2563eb");
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
  const { compare, toolLegendTools, dvnaCases, expandedUnique, stressRows, timing, scatterPearsonR } = data;
  const top = compare[0];
  const second = compare[1];
  const rStr = typeof scatterPearsonR === "number" && Number.isFinite(scatterPearsonR) ? scatterPearsonR.toFixed(2) : "—";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>VibeScan Poster</title>
<style>
:root{--blue:#1e3a5f;--border:#e2e8f0;--muted:#475569;--banner-purple:#322379}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f8fafc;padding:12px}
.poster{width:1536px;height:1152px;margin:0 auto;background:#fff;border:1px solid var(--border);border-radius:14px;display:flex;flex-direction:column;overflow:hidden}
.header{background:var(--banner-purple);color:#fff;padding:14px 20px 16px 16px;display:flex;flex-direction:row;align-items:center;gap:14px;flex-shrink:0;text-align:left}
.header-logo{flex:0 0 auto;height:4.75rem;width:auto;object-fit:contain;display:block}
.header-body{flex:1;min-width:0}
.header h1{margin:0;font-size:1.28rem;font-weight:700;line-height:1.22;letter-spacing:.01em}
.header-subtitle{margin:6px 0 0;font-size:.72rem;font-weight:400;line-height:1.35;opacity:.96;max-width:62rem}
.header-authors{margin:8px 0 0;font-size:.62rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.92}
.header-mentors{margin:4px 0 0;font-size:.62rem;opacity:.92}
.header-qr{flex:0 0 auto;align-self:center}
.header-qr img{display:block;width:5.25rem;height:5.25rem;object-fit:contain;background:#fff;padding:4px;border-radius:4px;box-sizing:border-box}
.content{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2.4fr);grid-template-rows:minmax(0,1fr);flex:1;min-height:0}
.results-comparison{grid-column:2;grid-row:1;display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden;padding-top:8px}
.results-comparison-title{font-size:.78rem;color:#1e3a5f;margin:0 0 8px;padding:0 12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;border-bottom:2px solid #2563eb;padding-bottom:5px;line-height:1.35;flex-shrink:0}
.results-comparison-body{display:grid;grid-template-columns:1fr 1.2fr;flex:1;min-height:0;align-content:start;min-width:0}
.tool-legend-wrap{flex-shrink:0;border-bottom:1px solid var(--border);background:linear-gradient(to bottom,#f8fafc,#fff);padding:6px 12px 8px;min-width:0}
.results-comparison-matrix{flex-shrink:0;padding:4px 10px 8px;border-bottom:1px solid var(--border);min-width:0}
.results-comparison-matrix .fig{margin-bottom:4px}
.fig--detection-matrix .fig-card{padding:0;background:#fff;overflow:hidden}
.detection-matrix-wrap{width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.detection-matrix{width:100%;border-collapse:collapse;table-layout:fixed;font-size:.58rem;line-height:1.18;color:#0f172a}
.detection-matrix caption{padding:0}
.detection-matrix th,.detection-matrix td{border:1px solid var(--border);padding:2px 4px;vertical-align:middle;word-break:break-word}
.detection-matrix thead th.dm-corner{text-align:left;font-weight:700;background:#f1f5f9;color:#475569;font-size:.52rem;line-height:1.2;padding:4px 6px}
.detection-matrix thead th.dm-tool{text-align:center;font-weight:700;padding:3px 2px;background:#fff}
.detection-matrix .dm-tn{display:block;font-size:.52rem;font-weight:800;color:#64748b;line-height:1}
.detection-matrix .dm-tab{display:block;font-size:.52rem;font-weight:700;color:#0f172a;line-height:1.15;margin-top:1px}
.detection-matrix thead th.dm-delta-h{text-align:center;font-weight:700;background:#f8fafc;width:2.6rem;font-size:.6rem}
.detection-matrix tbody .dm-fam{text-align:right;font-weight:600;color:#475569;width:13%;font-size:.55rem;padding:3px 5px}
.detection-matrix tbody .dm-case{text-align:right;font-size:.56rem;padding:3px 5px;color:#0f172a}
.detection-matrix .dm-cell{text-align:center;font-weight:700;font-size:.62rem;padding:2px 1px;width:6.8%}
.detection-matrix .dm-hit{background:#15803d;color:#fff}
.detection-matrix .dm-miss{background:#b91c1c;color:#fff}
.detection-matrix tbody .dm-delta{text-align:center;font-weight:600;color:#334155;font-size:.58rem;width:2.6rem}
.detection-matrix tbody tr.dm-row-alt{background:rgb(241 245 249 / 0.72)}
.detection-matrix tfoot td{border-top:2px solid #94a3b8}
.detection-matrix tfoot .dm-foot-label{text-align:right;font-size:.56rem;font-weight:700;background:#e0f2fe;color:#0c4a6e;padding:4px 6px}
.detection-matrix tfoot .dm-foot-cell{text-align:center;background:#e0f2fe;color:#0c4a6e;font-weight:700;font-size:.58rem}
.detection-matrix tfoot .dm-foot-of{font-weight:600;font-size:.52rem;opacity:.9}
.detection-matrix tfoot .dm-foot-dash{text-align:center;background:#e0f2fe;color:#64748b}
.dm-micro{margin:5px 6px 2px;font-size:.54rem;color:#64748b;text-align:center;line-height:1.3}
.dm-micro-k{font-weight:700;color:#475569}
.col--left-poster{grid-column:1;grid-row:1;align-self:stretch;min-height:0;min-width:0;border-right:1px solid var(--border)}
.col--mid-sm,.col--right-sm{min-height:0;min-width:0}
.tool-legend-heading{font-size:.62rem;font-weight:700;color:#1e3a5f;text-align:center;margin:0 0 5px;line-height:1.3;letter-spacing:.02em}
.tool-legend{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px 6px;max-width:100%}
.tool-legend-item{display:flex;align-items:center;gap:3px;font-size:.6rem;color:#334155;background:#fff;border:1px solid var(--border);border-radius:6px;padding:3px 5px;min-width:0}
.tool-num{font-size:.55rem;font-weight:800;color:#64748b;min-width:0.9em;flex-shrink:0}
.tool-swatch{display:inline-block;width:11px;height:11px;border-radius:3px;flex-shrink:0;border:1px solid rgb(0 0 0 / 0.12)}
.tool-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15}
.tool-legend-note{margin:5px 0 0;font-size:.55rem;color:#64748b;text-align:center;line-height:1.25;max-width:120ch;margin-left:auto;margin-right:auto}
.col{padding:8px 10px;border-right:1px solid var(--border);overflow:hidden}.col:last-child{border-right:none}.sec{margin-bottom:8px}.sec h2{font-size:.9rem;color:#1e3a5f;border-bottom:2px solid #2563eb;padding-bottom:2px;margin:0 0 4px}
.sec p,.sec li{font-size:.73rem;line-height:1.3}.fig{margin-bottom:8px}.fig-title{font-size:.64rem;text-transform:uppercase;font-weight:700;color:var(--muted);margin-bottom:3px}
.fig-card{border:1px solid var(--border);border-radius:8px;background:#fafbfd;padding:5px}.caption{font-size:.64rem;color:var(--muted);margin-top:4px;line-height:1.25}
.fig-narrative{margin:6px 0 0;font-size:.68rem;line-height:1.35;color:#334155}
.fig-card svg{width:100%;height:auto;display:block;border-radius:6px}
.col--mid-sm .fig .fig-card svg{width:86%;max-width:100%;margin-left:auto;margin-right:auto;display:block;height:auto}
.col--right-sm .fig .fig-card svg{width:78%;max-width:100%;margin-left:auto;margin-right:auto;display:block;height:auto}
.col--right-sm .fig{margin-bottom:6px}
.fig--heatmap .fig-card svg{width:78%;max-width:100%;margin-left:auto;margin-right:auto;display:block;height:auto}
.fig-card img{width:100%;height:auto;display:block;border-radius:6px}
.fig-img-depth{display:block;width:100%;max-width:100%;height:auto;max-height:320px;margin-left:auto;margin-right:auto;object-fit:contain}
.discussion{border-top:1px solid var(--border);padding:10px 16px}
.discussion h3{margin:0 0 5px;color:#1e3a5f}.discussion p{margin:0;font-size:.8rem;line-height:1.4}
.references{border-top:1px solid var(--border);padding:6px 8px 6px;font-size:.62rem;color:var(--muted);line-height:1.18}
.references h3{margin:0 0 4px;color:#1e3a5f;font-size:.72rem}.ref-list{margin:0;padding-left:14px}.ref-list li{margin-bottom:2px}.ref-list a{color:#1e40af;word-break:break-all}
.footer{border-top:1px solid var(--border);padding:9px 16px;font-size:.74rem;color:var(--muted);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
@media print{@page{size:48in 36in;margin:0}html,body{width:48in;height:36in}body{padding:0;background:#fff}.poster{width:48in;height:36in;border:none;border-radius:0}}
@media (max-width:1600px){.poster{width:100%;min-height:auto}.header{flex-wrap:wrap}.header-qr img{width:4.5rem;height:4.5rem}.content{grid-template-columns:1fr}.results-comparison{grid-column:1}.results-comparison-body{grid-template-columns:1fr}.col--left-poster{grid-column:1}.col{border-right:none;border-bottom:1px solid var(--border)}.tool-legend{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style></head><body><main class="poster">
<header class="header">
<img class="header-logo" src="./gannon-university-shield.png" width="94" height="109" alt="Gannon University"/>
<div class="header-body">
<h1>VibeScan: Multi-Dimensional Benchmark Analysis for JavaScript Security Scanning</h1>
<p class="header-subtitle">A reproducible multi-dimensional study on adjudicated DVNA with aligned peer tool runs: recall, cases-per-alert precision proxy, per-family coverage, and wall-clock scan time. CCSC 2026.</p>
<p class="header-authors">AUTHORS: JOSH OBERSTEADT</p>
<p class="header-mentors">Mentors: Kevin Brunner | Aquilla Galusha</p>
</div>
<div class="header-qr"><img src="./poster-banner-qr.png" width="110" height="110" alt="QR code"/></div>
</header>
<section class="content">
<div class="col col--left-poster">
<div class="sec"><h2>Abstract</h2><p>Comparing JavaScript security scanners by raw alert counts confounds detection with noise. We present a reproducible multi-dimensional study on an adjudicated DVNA benchmark [1] with aligned peer tool runs, expanded rule-family coverage, and metrics that separate what is found (recall) from triage burden (cases-per-alert precision proxy) and operational cost (wall-clock scan time). Findings are interpreted alongside standard web-application risk framing [2]. VibeScan attains the highest DVNA recall (${top.percent.toFixed(1)}%), ${(top.percent - second.percent).toFixed(1)} percentage points above the next-ranked scanner (${second.label}), with supporting analyses for difficulty-weighted coverage, recall–precision tradeoffs, and recall–time tradeoffs. Limitations: precision remains a proxy (not full per-alert false-positive adjudication for every tool), and the expanded corpus is partially VibeScan-aligned for family stress testing.</p></div>
<div class="sec"><h2>Research Questions</h2><ul><li>RQ1: Can VibeScan sustain top recall on hard cases?</li><li>RQ2: Where do peers diverge by family and case difficulty?</li><li>RQ3: How do precision-proxy and runtime affect practical scanner value?</li></ul></div>
<div class="sec"><h2>Method</h2><p>Datasets: DVNA (${dvnaCases}), expanded unique (${expandedUnique}), stress repeats (${stressRows}). Metrics: recall, cases-per-alert precision proxy, and case difficulty (ETS delta from consensus p where p=detected-by/6). Runtime: VibeScan wall-clock (${(timing.durationMs / 1000).toFixed(2)}s).</p></div>
<div class="fig"><div class="fig-title">Figure 1 - Analysis depth comparison</div><div class="fig-card"><img class="fig-img-depth" src="./comparison-overview.png" alt="VibeScan analysis depth comparison diagram"/></div><div class="caption">Clean stage-by-stage comparison of where peer tools stop vs where VibeScan continues.</div></div>
</div>
<section class="results-comparison" aria-labelledby="results-comparison-heading">
<h2 class="results-comparison-title" id="results-comparison-heading">Cross-tool DVNA results</h2>
${buildGlobalToolLegendHtml(toolLegendTools)}
<div class="results-comparison-matrix">
<div class="fig fig--detection-matrix"><div class="fig-title">Figure 4 - Detection matrix (expanded)</div><div class="fig-card">${figs.detectionMatrixTable}</div><div class="caption">Rows follow DVNA rule families; columns 1\u20136 match the tool key. Cells are hit/miss; \u0394 is case difficulty. Footer = hits per tool (of 11).</div></div>
</div>
<div class="results-comparison-body">
<div class="col col--mid-sm">
<div class="fig"><div class="fig-title">Figure 2 - Recall vs raw volume</div><div class="fig-card">${figs.scatter}</div><div class="caption">Dots use tool colors from the key. X-axis log-scaled; Pearson r on linear counts.</div><p class="fig-narrative">Raw alert volume confounds \u201cwho found more\u201d with triage noise. This plot links DVNA recall to total issues reported; Pearson r \u2248 ${rStr} on linear counts is consistent with separating what is found from how noisy the signal is.</p></div>
<div class="fig"><div class="fig-title">Figure 8 - Recall vs precision proxy</div><div class="fig-card">${figs.recallPrecision}</div><div class="caption">Points use tool colors from the key. Precision proxy = cases detected / raw alerts.</div><p class="fig-narrative">Each point is one tool: recall vs benchmark value per raw alert. Upper-right means strong coverage without drowning reviewers in noise\u2014the practical tradeoff behind RQ3.</p></div>
</div>
<div class="col col--right-sm">
<div class="fig"><div class="fig-title">Figure 9 - Recall vs scan time</div><div class="fig-card">${figs.recallTime}</div><div class="caption">Points use tool colors from the key. X-axis log-scaled (CodeQL runtime as outlier).</div><p class="fig-narrative">Same recall on the vertical axis; horizontal axis is wall-clock runtime (log scale). Shows the operational cost of high recall: sub-second local scans vs long-running analysis, with extreme runtimes as rightward outliers.</p></div>
<div class="sec"><h2>Limitations</h2><ul><li>Peer runtime fields are not in historical artifacts.</li><li>Precision proxy is not formal precision.</li><li>Expanded corpus remains VibeScan-focused.</li></ul></div>
<section class="references"><h3>References</h3><ol class="ref-list">
<li>AppSecCo. <em>Damn Vulnerable Node Application (DVNA)</em>. GitHub repository. <a href="https://github.com/appsecco/dvna">https://github.com/appsecco/dvna</a>.</li>
<li>OWASP Foundation. <em>OWASP Top 10:2021</em>. <a href="https://owasp.org/Top10/">https://owasp.org/Top10/</a>.</li>
<li>Semgrep, Inc. <em>Semgrep documentation</em>. <a href="https://semgrep.dev/docs/">https://semgrep.dev/docs/</a>.</li>
<li>GitHub. <em>CodeQL documentation</em>. <a href="https://codeql.github.com/docs/">https://codeql.github.com/docs/</a>.</li>
<li>ESLint Community. <em>eslint-plugin-security</em>. <a href="https://github.com/eslint-community/eslint-plugin-security">https://github.com/eslint-community/eslint-plugin-security</a>.</li>
<li>Snyk Ltd. <em>Snyk CLI</em>. <a href="https://docs.snyk.io/snyk-cli">https://docs.snyk.io/snyk-cli</a>.</li>
<li>Bearer. <em>Bearer (open-source static analysis)</em>. <a href="https://github.com/Bearer/bearer">https://github.com/Bearer/bearer</a>.</li>
<li>ETS. <em>Final Study Statistical Analysis for the Redesigned TOEIC Bridge Tests</em> (RM-19-09), item difficulty definitions for p and delta.</li>
</ol></section>
</div>
</div>
</section>
</section>
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
  const scatterPearsonR = pearson(
    compare.map((r) => r.rawIssues),
    compare.map((r) => r.percent)
  );

  const figs = {
    recall: buildRecallBarSvg(compare),
    scatter: buildScatterSvg(compare),
    coverage: buildCoverageGapSvg(dvnaCatalog.cases.length, frameworkCatalog.cases.length, manifest.families.length),
    heatmap: buildHeatmapSvg(dvnaCatalog, dvnaMatrix),
    detectionMatrixTable: buildDetectionMatrixTableHtml(dvnaCatalog, dvnaMatrix),
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
      toolLegendTools: getLegendTools(dvnaMatrix),
      dvnaCases: dvnaCatalog.cases.length,
      expandedUnique: frameworkCatalog.cases.length,
      stressRows: highVolumeCatalog.cases.length,
      timing,
      scatterPearsonR,
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
