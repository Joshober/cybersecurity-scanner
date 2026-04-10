/**
 * Figure 4 - Coverage by difficulty band.
 * Grouped bars show per-tool detection rate within each Δ band (six-tool consensus k).
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const FONT = "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const TOOLS = [
    { id: "vibescan", num: "1", label: "VibeScan", color: "#009E73" },
    { id: "bearer", num: "2", label: "Bearer", color: "#0072B2" },
    { id: "snyk-code", num: "3", label: "Snyk", color: "#E69F00" },
    { id: "semgrep", num: "4", label: "Semgrep", color: "#D55E00" },
    { id: "codeql", num: "5", label: "CodeQL", color: "#CC79A7" },
    { id: "eslint-security", num: "6", label: "ESLint", color: "#56B4E9" },
  ];

  const DETECTIONS = {
    vibescan: {
      "sqli-apphandler": true,
      "cmd-inject-apphandler": true,
      "open-redirect": true,
      "insecure-deser": true,
      "nosql-apphandler": true,
      "nosql-auth": true,
      "nosql-passport": true,
      "weak-hash-auth": true,
      "hardcoded-session-secret": true,
      "default-secret-fallback": true,
      "dom-xss": true,
    },
    bearer: {
      "sqli-apphandler": true,
      "cmd-inject-apphandler": true,
      "open-redirect": true,
      "insecure-deser": false,
      "nosql-apphandler": true,
      "nosql-auth": true,
      "nosql-passport": true,
      "weak-hash-auth": true,
      "hardcoded-session-secret": true,
      "default-secret-fallback": false,
      "dom-xss": false,
    },
    "snyk-code": {
      "sqli-apphandler": true,
      "cmd-inject-apphandler": true,
      "open-redirect": true,
      "insecure-deser": true,
      "nosql-apphandler": false,
      "nosql-auth": false,
      "nosql-passport": false,
      "weak-hash-auth": true,
      "hardcoded-session-secret": true,
      "default-secret-fallback": false,
      "dom-xss": true,
    },
    semgrep: {
      "sqli-apphandler": true,
      "cmd-inject-apphandler": false,
      "open-redirect": true,
      "insecure-deser": true,
      "nosql-apphandler": false,
      "nosql-auth": false,
      "nosql-passport": false,
      "weak-hash-auth": false,
      "hardcoded-session-secret": true,
      "default-secret-fallback": false,
      "dom-xss": false,
    },
    codeql: {
      "sqli-apphandler": true,
      "cmd-inject-apphandler": true,
      "open-redirect": true,
      "insecure-deser": true,
      "nosql-apphandler": false,
      "nosql-auth": false,
      "nosql-passport": false,
      "weak-hash-auth": false,
      "hardcoded-session-secret": true,
      "default-secret-fallback": true,
      "dom-xss": false,
    },
    "eslint-security": {
      "sqli-apphandler": true,
      "cmd-inject-apphandler": false,
      "open-redirect": false,
      "insecure-deser": false,
      "nosql-apphandler": false,
      "nosql-auth": false,
      "nosql-passport": false,
      "weak-hash-auth": false,
      "hardcoded-session-secret": false,
      "default-secret-fallback": false,
      "dom-xss": false,
    },
  };

  const CASE_IDS = [
    "nosql-apphandler",
    "nosql-auth",
    "nosql-passport",
    "default-secret-fallback",
    "dom-xss",
    "weak-hash-auth",
    "cmd-inject-apphandler",
    "open-redirect",
    "insecure-deser",
    "hardcoded-session-secret",
    "sqli-apphandler",
  ];

  const CASE_LABELS = {
    "nosql-apphandler": "NoSQL (route)",
    "nosql-auth": "NoSQL (auth)",
    "nosql-passport": "NoSQL (session)",
    "default-secret-fallback": "Env fallback",
    "dom-xss": "DOM XSS",
    "weak-hash-auth": "Weak hash",
    "cmd-inject-apphandler": "Command inj.",
    "open-redirect": "Open redirect",
    "insecure-deser": "Unsafe deser.",
    "hardcoded-session-secret": "Hardcoded secret",
    "sqli-apphandler": "SQL inj.",
  };

  const KS = [2, 3, 4, 5, 6];

  function el(name, attrs, children) {
    const node = document.createElementNS(NS, name);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((child) => {
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function consensus6(caseId) {
    let count = 0;
    TOOLS.forEach((tool) => {
      if (DETECTIONS[tool.id][caseId]) count += 1;
    });
    return count;
  }

  function deltaFromK(k) {
    return 18.3 - 1.8 * k;
  }

  function buildBandData() {
    const casesByK = new Map();
    KS.forEach((k) => casesByK.set(k, []));

    CASE_IDS.forEach((caseId) => {
      const k = consensus6(caseId);
      if (!casesByK.has(k)) casesByK.set(k, []);
      casesByK.get(k).push(caseId);
    });

    return KS.map((k) => {
      const caseIds = casesByK.get(k) || [];
      const n = caseIds.length;
      const delta = deltaFromK(k);
      const caseLabels = caseIds.map((id) => CASE_LABELS[id] || id);

      const ratesByTool = {};
      TOOLS.forEach((tool) => {
        let hits = 0;
        caseIds.forEach((caseId) => {
          if (DETECTIONS[tool.id][caseId]) hits += 1;
        });
        ratesByTool[tool.id] = n > 0 ? (hits / n) * 100 : 0;
      });

      return { k, delta, n, caseLabels, ratesByTool };
    }).sort((a, b) => a.delta - b.delta || b.k - a.k); // left = easy (low Δ, high k); right = hard (high Δ, low k); stable
  }

  function render(container) {
    if (!container || container.getAttribute("data-rendered") === "1") return;
    container.setAttribute("data-rendered", "1");
    container.replaceChildren();

    const bands = buildBandData();

    const W = 720;
    const H = 352;
    const padL = 62;
    const padR = 24;
    const padT = 14;
    const padB = 112;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const plotBottom = padT + innerH;

    const yToPx = (v) => padT + (1 - v / 100) * innerH;
    /** Visible stub for 0% in a non-empty band: half prior height; means evaluated & missed, not skipped. */
    const MIN_ZERO_STUB_H = 8;

    const groupGap = 14;
    const totalGaps = groupGap * (bands.length - 1);
    const groupW = (innerW - totalGaps) / bands.length;
    const barsTotalW = groupW * 0.82;
    const barGap = 2;
    const barW = (barsTotalW - barGap * (TOOLS.length - 1)) / TOOLS.length;

    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      height: "auto",
      "aria-hidden": "true",
      focusable: "false",
    });

    const defs = el("defs");
    const missPattern = el("pattern", {
      id: "fig4-missed-hatch",
      patternUnits: "userSpaceOnUse",
      width: "6",
      height: "6",
    });
    missPattern.appendChild(el("rect", { width: "6", height: "6", fill: "#eef2f7" }));
    missPattern.appendChild(
      el("path", {
        d: "M0,6 L6,0",
        stroke: "#94a3b8",
        "stroke-width": "1",
      })
    );
    defs.appendChild(missPattern);
    svg.appendChild(defs);

    svg.appendChild(el("rect", { x: "0", y: "0", width: String(W), height: String(H), fill: "#ffffff" }));

    [0, 20, 40, 60, 80, 100].forEach((tick) => {
      const y = yToPx(tick);
      svg.appendChild(
        el("line", {
          x1: String(padL),
          y1: String(y),
          x2: String(padL + innerW),
          y2: String(y),
          stroke: "#dbe3ee",
          "stroke-width": "1",
        })
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(padL - 8),
            y: String(y + 4),
            "text-anchor": "end",
            "font-family": FONT,
            "font-size": "10",
            "font-weight": "500",
            fill: "#475569",
          },
          [String(tick)]
        )
      );
    });

    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(padT),
        x2: String(padL),
        y2: String(plotBottom),
        stroke: "#334155",
        "stroke-width": "1.5",
      })
    );
    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(plotBottom),
        x2: String(padL + innerW),
        y2: String(plotBottom),
        stroke: "#334155",
        "stroke-width": "1.5",
      })
    );

    bands.forEach((band, bi) => {
      const groupX = padL + bi * (groupW + groupGap);
      const barsStartX = groupX + (groupW - barsTotalW) / 2;

      TOOLS.forEach((tool, ti) => {
        const value = band.ratesByTool[tool.id];
        const isZeroStub = band.n > 0 && value <= 0;
        const barX = barsStartX + ti * (barW + barGap);
        const barTop = isZeroStub ? plotBottom - MIN_ZERO_STUB_H : yToPx(value);
        const barH = isZeroStub ? MIN_ZERO_STUB_H : plotBottom - barTop;
        const isVibe = tool.id === "vibescan";

        const barRect = el("rect", {
          x: String(barX),
          y: String(barTop),
          width: String(barW),
          height: String(barH),
          fill: isZeroStub ? "url(#fig4-missed-hatch)" : tool.color,
          opacity: isVibe ? "0.97" : isZeroStub ? "1" : "0.68",
          stroke: isVibe ? "#065f46" : isZeroStub ? tool.color : "none",
          "stroke-width": isVibe ? "1" : isZeroStub ? "1.25" : "0",
          "stroke-dasharray": isZeroStub ? "2 2" : undefined,
        });
        barRect.appendChild(
          el(
            "title",
            {},
            [
              isZeroStub
                ? `${tool.label}: 0% in this band — DVNA case(s) here were evaluated; this tool did not flag them (miss), not skipped.`
                : `${tool.label}: ${Math.round(value)}% of cases in this band`,
            ]
          )
        );
        svg.appendChild(barRect);

      });

      const centerX = groupX + groupW / 2;
      svg.appendChild(
        el(
          "text",
          {
            x: String(centerX),
            y: String(plotBottom + 16),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": "10",
            "font-weight": "700",
            fill: "#0f172a",
          },
          [`Delta ${band.delta.toFixed(1)}`]
        )
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(centerX),
            y: String(plotBottom + 29),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": "9",
            "font-weight": "600",
            fill: "#475569",
          },
          [`k=${band.k}/6, n=${band.n}`]
        )
      );

      const casesLine = (band.caseLabels || []).join(" · ");
      const clipped = casesLine.length > 46 ? casesLine.slice(0, 44) + "…" : casesLine;
      svg.appendChild(
        el(
          "text",
          {
            x: String(centerX),
            y: String(plotBottom + 43),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": "7.2",
            "font-weight": "500",
            fill: "#64748b",
          },
          [clipped]
        )
      );
    });

    const yLabelX = 16;
    const yLabelY = padT + innerH / 2;
    svg.appendChild(
      el(
        "text",
        {
          x: String(yLabelX),
          y: String(yLabelY),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "10",
          "font-weight": "600",
          fill: "#0f172a",
          transform: `rotate(-90 ${yLabelX} ${yLabelY})`,
        },
        ["Detection rate within band (%)"]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(W / 2),
          y: String(H - 52),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "9.5",
          "font-weight": "600",
          fill: "#0f172a",
        },
        ["Bands left → right: increasing Δ (easiest → hardest); k under each band runs 6…2, not 2…6."]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(W / 2),
          y: String(H - 39),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "8.5",
          "font-weight": "500",
          fill: "#334155",
        },
        [
          "Within each band, bars are always the same order: tool 1–6 (VibeScan → ESLint), matching the poster key.",
        ]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(W / 2),
          y: String(H - 27),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "8.5",
          fill: "#64748b",
        },
        ["Delta = 18.3 - 1.8xk, where k is the number of tools that detected the case"]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(W / 2),
          y: String(H - 14),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "7.5",
          "font-weight": "500",
          fill: "#64748b",
        },
        [
          "Short hatched bar with colored outline = 0%: case(s) in band evaluated; tool missed (not skipped from evaluation).",
        ]
      )
    );

    container.appendChild(svg);
  }

  function init() {
    const root = document.getElementById("figure-4-difficulty-coverage-chart");
    if (root) render(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();