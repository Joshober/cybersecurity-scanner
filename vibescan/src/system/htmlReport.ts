/**
 * Static HTML report (no server, no frontend framework).
 * Consumes the same shape as `formatProjectJson` output or `Finding[]` + summary.
 */

import type { Category, ProjectScanResult, Severity } from "./types.js";
import { getRuleDocumentation } from "./ruleCatalog.js";
import { summarizeFindings, type FindingsSummary } from "./format.js";

function summarizeRows(rows: HtmlReportFindingRow[]): FindingsSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
  };
  const byRuleId: Record<string, number> = {};
  const byCategory: Record<Category, number> = { crypto: 0, injection: 0, api_inventory: 0 };
  for (const r of rows) {
    const s = (r.severity as Severity) ?? "info";
    if (s in bySeverity) bySeverity[s]++;
    const rid = r.ruleId ?? "(unknown)";
    byRuleId[rid] = (byRuleId[rid] ?? 0) + 1;
    const cat = (r.category as Category) ?? "injection";
    if (cat in byCategory) byCategory[cat]++;
  }
  return {
    totalFindings: rows.length,
    bySeverity,
    byRuleId,
    byCategory,
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Loose finding row from saved JSON (may omit ruleDocumentation). */
export interface HtmlReportFindingRow {
  ruleId?: string;
  message?: string;
  severity?: Severity | string;
  severityLabel?: string;
  category?: string;
  file?: string;
  filePath?: string;
  line?: number;
  column?: number;
  cwe?: number;
  owasp?: string;
  why?: string;
  remediation?: string;
  fix?: string;
  sourceLabel?: string;
  sinkLabel?: string;
  route?: { method?: string; fullPath?: string };
  proofGeneration?: Record<string, unknown>;
  ruleDocumentation?: {
    title?: string;
    risk?: string;
    remediation?: string;
    secureExample?: string;
    referenceUrls?: string[];
    pattern?: string;
    falsePositives?: string;
  };
}

export interface HtmlReportMeta {
  toolVersion?: string;
  generatedAt?: string;
  buildId?: string;
  projectLabel?: string;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNum(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function normalizeRow(raw: unknown): HtmlReportFindingRow {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const rd = o.ruleDocumentation;
  let ruleDocumentation: HtmlReportFindingRow["ruleDocumentation"];
  if (rd && typeof rd === "object") {
    const r = rd as Record<string, unknown>;
    const urls = r.referenceUrls;
    ruleDocumentation = {
      title: asString(r.title),
      risk: asString(r.risk),
      remediation: asString(r.remediation),
      secureExample: asString(r.secureExample),
      pattern: asString(r.pattern),
      falsePositives: asString(r.falsePositives),
      referenceUrls: Array.isArray(urls) ? urls.filter((u): u is string => typeof u === "string") : undefined,
    };
  }
  const route = o.route;
  let routeOut: HtmlReportFindingRow["route"];
  if (route && typeof route === "object") {
    const rt = route as Record<string, unknown>;
    routeOut = { method: asString(rt.method), fullPath: asString(rt.fullPath) };
  }
  const pg = o.proofGeneration;
  const proofGeneration =
    pg && typeof pg === "object" ? (pg as Record<string, unknown>) : undefined;

  return {
    ruleId: asString(o.ruleId),
    message: asString(o.message),
    severity: (asString(o.severity) as Severity | undefined) ?? undefined,
    severityLabel: asString(o.severityLabel),
    category: asString(o.category),
    file: asString(o.file),
    filePath: asString(o.filePath),
    line: asNum(o.line),
    column: asNum(o.column),
    cwe: asNum(o.cwe),
    owasp: asString(o.owasp),
    why: asString(o.why),
    remediation: asString(o.remediation),
    fix: asString(o.fix),
    sourceLabel: asString(o.sourceLabel),
    sinkLabel: asString(o.sinkLabel),
    route: routeOut,
    proofGeneration,
    ruleDocumentation,
  };
}

/** Extract findings array from a saved `formatProjectJson` document. */
export function extractFindingsFromProjectJson(data: unknown): HtmlReportFindingRow[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  if (Array.isArray(root.findings)) {
    return root.findings.map(normalizeRow);
  }
  const fr = root.fileResults;
  if (Array.isArray(fr)) {
    const out: HtmlReportFindingRow[] = [];
    for (const block of fr) {
      if (!block || typeof block !== "object") continue;
      const f = (block as Record<string, unknown>).findings;
      if (Array.isArray(f)) out.push(...f.map(normalizeRow));
    }
    return out;
  }
  return [];
}

export function metaFromProjectJson(data: unknown): Pick<HtmlReportMeta, "buildId"> {
  if (!data || typeof data !== "object") return {};
  const root = data as Record<string, unknown>;
  const b = root.buildId;
  return { buildId: typeof b === "string" ? b : undefined };
}

function docForRow(row: HtmlReportFindingRow): ReturnType<typeof getRuleDocumentation> {
  const id = row.ruleId ?? "";
  const embedded = row.ruleDocumentation;
  const base = getRuleDocumentation(id);
  if (!embedded) return base;
  return {
    ...base,
    title: embedded.title ?? base.title,
    pattern: embedded.pattern ?? base.pattern,
    risk: embedded.risk ?? base.risk,
    falsePositives: embedded.falsePositives ?? base.falsePositives,
    remediation: embedded.remediation ?? base.remediation,
    secureExample: embedded.secureExample ?? base.secureExample,
    referenceUrls:
      embedded.referenceUrls && embedded.referenceUrls.length > 0
        ? embedded.referenceUrls
        : base.referenceUrls,
  };
}

function severityClass(sev: string | undefined): string {
  const s = (sev ?? "").toLowerCase();
  if (s === "critical") return "sev-critical";
  if (s === "error") return "sev-error";
  if (s === "warning") return "sev-warning";
  if (s === "info") return "sev-info";
  return "sev-unknown";
}

function proofBlock(row: HtmlReportFindingRow): string {
  const p = row.proofGeneration;
  if (!p) return "";
  const status = escapeHtml(String(p.status ?? ""));
  const gen = escapeHtml(String(p.generatorId ?? ""));
  const was = p.wasGenerated === true ? "yes" : "no";
  const path = p.generatedPath != null ? escapeHtml(String(p.generatedPath)) : "";
  const lines: string[] = [
    `<div class="proof-box">`,
    `<strong>Proof-oriented test generation</strong>`,
    `<div class="kv"><span>Status</span><span>${status}</span></div>`,
    `<div class="kv"><span>Generator</span><span>${gen}</span></div>`,
    `<div class="kv"><span>Generated</span><span>${escapeHtml(was)}</span></div>`,
  ];
  if (path) lines.push(`<div class="kv"><span>Path</span><span><code>${path}</code></span></div>`);
  if (Array.isArray(p.manualNeeded) && p.manualNeeded.length) {
    lines.push(
      `<div class="kv"><span>Manual</span><span>${escapeHtml(p.manualNeeded.join("; "))}</span></div>`
    );
  }
  if (p.notes) lines.push(`<div class="notes">${escapeHtml(String(p.notes))}</div>`);
  lines.push(`</div>`);
  return lines.join("");
}

/**
 * Build HTML from normalized rows + summary (all server-side escaped).
 */
export function buildHtmlReport(input: {
  findings: HtmlReportFindingRow[];
  summary: FindingsSummary;
  meta?: HtmlReportMeta;
}): string {
  const { findings, summary, meta } = input;
  const title = "VibeScan security report";
  const when = meta?.generatedAt ?? new Date().toISOString();
  const ver = meta?.toolVersion ?? "";
  const build = meta?.buildId ?? "";
  const label = meta?.projectLabel ?? "";

  const bySev = summary.bySeverity;
  const cards = [
    { key: "critical", label: "Critical", n: bySev.critical ?? 0, cls: "sev-critical" },
    { key: "error", label: "Error (High)", n: bySev.error ?? 0, cls: "sev-error" },
    { key: "warning", label: "Warning (Med)", n: bySev.warning ?? 0, cls: "sev-warning" },
    { key: "info", label: "Info (Low)", n: bySev.info ?? 0, cls: "sev-info" },
  ];

  const cardHtml = cards
    .map(
      (c) =>
        `<div class="card ${c.cls}" data-sev="${escapeHtml(c.key)}"><div class="card-n">${c.n}</div><div class="card-l">${escapeHtml(c.label)}</div></div>`
    )
    .join("");

  const ruleSet = new Set<string>();
  const fileSet = new Set<string>();
  for (const f of findings) {
    if (f.ruleId) ruleSet.add(f.ruleId);
    const fp = f.file ?? f.filePath ?? "";
    if (fp) fileSet.add(fp);
  }
  const rulesSorted = [...ruleSet].sort();
  const filesSorted = [...fileSet].sort();

  const ruleOptions = [
    `<option value="">All rules</option>`,
    ...rulesSorted.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`),
  ].join("");

  const fileOptions = [
    `<option value="">All files</option>`,
    ...filesSorted.map((f) => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`),
  ].join("");

  const rows: string[] = [];
  findings.forEach((row, idx) => {
    const doc = docForRow(row);
    const rid = row.ruleId ?? "(unknown)";
    const msg = row.message ?? "";
    const file = row.file ?? row.filePath ?? "";
    const sev = (row.severity as string) ?? "";
    const sevLabel = row.severityLabel ?? "";
    const filterFile = file;
    const detailsId = `f-${idx}`;
    const locLine =
      row.line != null
        ? `Line ${row.line}` + (row.column != null ? `, col ${row.column}` : "")
        : "—";

    const metaBits: string[] = [];
    if (row.cwe != null) metaBits.push(`CWE-${row.cwe}`);
    if (row.owasp) metaBits.push(`OWASP ${row.owasp}`);
    const metaStr = metaBits.length ? metaBits.join(" · ") : "";

    const why = row.why?.trim() || doc.risk;
    const fix = row.remediation?.trim() || row.fix?.trim() || doc.remediation;
    const example = doc.secureExample.trim();

    rows.push(`<article class="finding" data-severity="${escapeHtml(sev)}" data-rule="${escapeHtml(rid)}" data-file="${escapeHtml(filterFile)}" data-search="${escapeHtml(`${rid} ${msg} ${file} ${why}`.toLowerCase())}">
  <button type="button" class="finding-head" aria-expanded="false" aria-controls="${detailsId}" id="btn-${detailsId}">
    <span class="pill ${severityClass(sev)}">${escapeHtml(sevLabel || sev || "?")}</span>
    <span class="rule">${escapeHtml(rid)}</span>
    <span class="msg">${escapeHtml(msg)}</span>
    <span class="loc">${escapeHtml(file)}:${row.line ?? "—"}</span>
  </button>
  <div class="finding-body" id="${detailsId}" hidden>
    <div class="grid">
      <section>
        <h3>Location</h3>
        <p><code>${escapeHtml(file || "—")}</code></p>
        <p>${escapeHtml(locLine)}</p>
        ${row.route ? `<p><strong>Route</strong> ${escapeHtml(row.route.method ?? "")} ${escapeHtml(row.route.fullPath ?? "")}</p>` : ""}
        ${row.sourceLabel ? `<p><strong>Source</strong> ${escapeHtml(row.sourceLabel)}</p>` : ""}
        ${row.sinkLabel ? `<p><strong>Sink</strong> ${escapeHtml(row.sinkLabel)}</p>` : ""}
      </section>
      <section>
        <h3>Taxonomy</h3>
        <p>${metaStr ? escapeHtml(metaStr) : "—"}</p>
        <p><strong>${escapeHtml(doc.title)}</strong></p>
      </section>
    </div>
    <section>
      <h3>Why it matters</h3>
      <p>${escapeHtml(why)}</p>
    </section>
    <section>
      <h3>Suggested fix</h3>
      <p>${escapeHtml(fix)}</p>
    </section>
    <section>
      <h3>Safe pattern (example)</h3>
      <pre class="code"><code>${escapeHtml(example)}</code></pre>
    </section>
    <section>
      <h3>References</h3>
      <ul class="refs">
        ${doc.referenceUrls.map((u) => `<li><a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a></li>`).join("")}
      </ul>
    </section>
    ${proofBlock(row)}
  </div>
</article>`);
  });

  const headExtra = `
  <style>
    :root {
      --bg: #0f1419;
      --panel: #1a2332;
      --text: #e7ecf3;
      --muted: #8b9cb3;
      --border: #2d3a4d;
      --accent: #3d8bfd;
      --critical: #f85149;
      --error: #ff9f43;
      --warning: #f0c14d;
      --info: #58a6ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }
    header { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    header h1 { margin: 0 0 0.35rem; font-size: 1.5rem; font-weight: 650; letter-spacing: -0.02em; }
    .sub { color: var(--muted); font-size: 0.9rem; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
    @media (max-width: 900px) { .cards { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 500px) { .cards { grid-template-columns: 1fr; } }
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.9rem 1rem;
      border-left: 4px solid var(--accent);
    }
    .card.sev-critical { border-left-color: var(--critical); }
    .card.sev-error { border-left-color: var(--error); }
    .card.sev-warning { border-left-color: var(--warning); }
    .card.sev-info { border-left-color: var(--info); }
    .card-n { font-size: 1.75rem; font-weight: 700; line-height: 1.1; }
    .card-l { color: var(--muted); font-size: 0.8rem; margin-top: 0.25rem; }
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center;
      margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--panel);
      border: 1px solid var(--border); border-radius: 10px;
    }
    .toolbar label { font-size: 0.75rem; color: var(--muted); display: block; margin-bottom: 0.2rem; }
    .toolbar input, .toolbar select {
      background: var(--bg); color: var(--text); border: 1px solid var(--border);
      border-radius: 6px; padding: 0.4rem 0.55rem; font-size: 0.85rem; min-width: 140px;
    }
    .toolbar input[type="search"] { min-width: 200px; flex: 1 1 180px; }
    .findings { display: flex; flex-direction: column; gap: 0.5rem; }
    .finding {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .finding.hidden { display: none; }
    .finding-head {
      width: 100%; text-align: left;
      display: grid;
      grid-template-columns: minmax(72px, auto) minmax(100px, 140px) 1fr minmax(120px, 1fr);
      gap: 0.65rem; align-items: start;
      padding: 0.65rem 0.85rem;
      background: transparent; border: none; color: inherit; cursor: pointer;
      font: inherit;
    }
    @media (max-width: 800px) {
      .finding-head { grid-template-columns: 1fr; }
    }
    .finding-head:hover { background: rgba(255,255,255,0.03); }
    .pill {
      display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;
      padding: 0.2rem 0.45rem; border-radius: 4px; text-transform: uppercase;
    }
    .sev-critical { background: rgba(248,81,73,0.2); color: #ffb4b0; }
    .sev-error { background: rgba(255,159,67,0.15); color: #ffd4a8; }
    .sev-warning { background: rgba(240,193,77,0.12); color: #ffe7a3; }
    .sev-info { background: rgba(88,166,255,0.12); color: #a8d4ff; }
    .sev-unknown { background: #333; color: #ccc; }
    .rule { font-family: ui-monospace, monospace; font-size: 0.8rem; color: var(--accent); }
    .msg { font-size: 0.88rem; }
    .loc { font-size: 0.78rem; color: var(--muted); font-family: ui-monospace, monospace; }
    .finding-body { padding: 0 1rem 1rem 1rem; border-top: 1px solid var(--border); }
    .finding-body[hidden] { display: none; }
    .finding.is-open .finding-body { display: block; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
    h3 { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin: 0.75rem 0 0.35rem; }
    p { margin: 0.25rem 0; font-size: 0.9rem; }
    pre.code {
      margin: 0; padding: 0.75rem 1rem; background: var(--bg); border-radius: 8px;
      border: 1px solid var(--border); overflow-x: auto; font-size: 0.8rem;
    }
    .refs { margin: 0; padding-left: 1.1rem; }
    .refs a { color: var(--accent); }
    .proof-box {
      margin-top: 0.75rem; padding: 0.75rem 1rem; background: rgba(61,139,253,0.08);
      border-radius: 8px; border: 1px solid var(--border); font-size: 0.88rem;
    }
    .proof-box .kv { display: grid; grid-template-columns: 100px 1fr; gap: 0.35rem; margin: 0.25rem 0; }
    .proof-box .notes { margin-top: 0.5rem; color: var(--muted); }
    .empty { text-align: center; padding: 2rem; color: var(--muted); }
    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.8rem; }
  </style>`;

  const script = `
<script>
(function () {
  var articles = [].slice.call(document.querySelectorAll(".finding"));
  var q = document.getElementById("filter-q");
  var sev = document.getElementById("filter-sev");
  var rule = document.getElementById("filter-rule");
  var file = document.getElementById("filter-file");
  function apply() {
    var qv = (q && q.value || "").toLowerCase().trim();
    var sv = sev && sev.value || "";
    var rv = rule && rule.value || "";
    var fv = file && file.value || "";
    var n = 0;
    articles.forEach(function (el) {
      var ok = true;
      if (sv && el.getAttribute("data-severity") !== sv) ok = false;
      if (ok && rv && el.getAttribute("data-rule") !== rv) ok = false;
      if (ok && fv && el.getAttribute("data-file") !== fv) ok = false;
      if (ok && qv) {
        var hay = el.getAttribute("data-search") || "";
        if (hay.indexOf(qv) === -1) ok = false;
      }
      el.classList.toggle("hidden", !ok);
      if (ok) n++;
    });
    var elc = document.getElementById("visible-count");
    if (elc) elc.textContent = String(n);
  }
  [q, sev, rule, file].forEach(function (el) { if (el) el.addEventListener("input", apply); if (el) el.addEventListener("change", apply); });
  apply();
  articles.forEach(function (art) {
    var btn = art.querySelector(".finding-head");
    var body = art.querySelector(".finding-body");
    if (!btn || !body) return;
    btn.addEventListener("click", function () {
      var open = !art.classList.contains("is-open");
      art.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) body.removeAttribute("hidden"); else body.setAttribute("hidden", "hidden");
    });
  });
})();
</script>`;

  const empty =
    findings.length === 0
      ? `<p class="empty">No findings in this report. Your project looks clean for the rules that ran.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
${headExtra}
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="sub">${escapeHtml(when)}${ver ? ` · VibeScan ${escapeHtml(ver)}` : ""}${build ? ` · build ${escapeHtml(build)}` : ""}${label ? ` · ${escapeHtml(label)}` : ""}</p>
      <p class="sub">${summary.totalFindings} finding(s) · filter and expand rows below</p>
    </header>
    <div class="cards">${cardHtml}</div>
    <div class="toolbar">
      <div>
        <label for="filter-q">Search</label>
        <input type="search" id="filter-q" placeholder="Message, rule, file…" autocomplete="off" />
      </div>
      <div>
        <label for="filter-sev">Severity</label>
        <select id="filter-sev">
          <option value="">All</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>
      <div>
        <label for="filter-rule">Rule</label>
        <select id="filter-rule">${ruleOptions}</select>
      </div>
      <div>
        <label for="filter-file">File</label>
        <select id="filter-file">${fileOptions}</select>
      </div>
      <div style="align-self:flex-end;margin-left:auto;font-size:0.85rem;color:var(--muted);">
        Showing <strong id="visible-count">0</strong> of ${findings.length}
      </div>
    </div>
    <div class="findings">
      ${empty}
      ${rows.join("\n")}
    </div>
    <footer>
      Static report generated by VibeScan — no server required. Open this file in any browser.
    </footer>
  </div>
${script}
</body>
</html>`;
}

export function projectScanToHtmlReport(
  project: ProjectScanResult,
  meta?: HtmlReportMeta
): string {
  const findings = project.findings as unknown as HtmlReportFindingRow[];
  const summary = summarizeFindings(project.findings);
  return buildHtmlReport({
    findings,
    summary,
    meta: { ...meta, buildId: meta?.buildId ?? project.buildId },
  });
}

export function projectJsonToHtmlReport(jsonText: string, meta?: HtmlReportMeta): string {
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON");
  }
  const rows = extractFindingsFromProjectJson(data);
  const m = metaFromProjectJson(data);
  const summary = summarizeRows(rows);
  return buildHtmlReport({
    findings: rows,
    summary,
    meta: { ...meta, buildId: meta?.buildId ?? m.buildId },
  });
}
