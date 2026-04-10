/**
 * Renders Figure 1 — Analysis depth pipeline (peer tools vs VibeScan) as SVG.
 * Semantics match docs/vibescan/comparison-overview.mmd
 * Stop callouts sit to the right of the stack with colored branches and ✕ marks.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  /** @param {string} name @param {Record<string, string>} [attrs] @param {(Node|string)[]} [children] */
  function el(name, attrs, children) {
    const e = document.createElementNS(NS, name);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (attrs[k] != null) e.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => {
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }

  const themes = {
    basic: { fill: "#f3f4f6", stroke: "#9ca3af", sw: "1" },
    flow: { fill: "#dbeafe", stroke: "#3b82f6", sw: "1" },
    cross: { fill: "#e0e7ff", stroke: "#6366f1", sw: "1" },
    advanced: { fill: "#ffedd5", stroke: "#ea580c", sw: "1" },
    unique: { fill: "#dcfce7", stroke: "#16a34a", sw: "2" },
  };

  const nodes = [
    { key: "basic", lines: ["1. Pattern Matching", "AST node-level checks"] },
    { key: "flow", lines: ["2. Taint / Data Flow", "Source-to-sink within files"] },
    { key: "cross", lines: ["3. Cross-File Analysis", "Inter-procedural + types"] },
    { key: "advanced", lines: ["4. Route + API Reasoning", "Routes · API drift · trust"] },
    { key: "unique", lines: ["5. Proof Generation + CI Gates", "Tests · recall regression"] },
    { key: "unique", lines: ["VibeScan", "11/11 recall · 25 alerts", "Only tool at full depth"] },
  ];

  /**
   * Per edge after node i (connector i → i+1).
   * branchColor: horizontal spur + ✕; lines: main copy; extraLines: muted sublines.
   * tspans: optional [{ fill, text }] for first line (peer tools).
   */
  const edgeCallouts = [
    {
      branchColor: "#56B4E9",
      lines: ["eslint-plugin-security stops · 1/11 · 493 alerts"],
    },
    {
      branchColor: "#D55E00",
      lines: ["Semgrep stops · 4/11 · 11 alerts"],
    },
    {
      branchColor: "#94a3b8",
      tspans: [
        { fill: "#CC79A7", text: "✕ CodeQL 6/11" },
        { fill: "#64748b", text: "  ·  " },
        { fill: "#E69F00", text: "✕ Snyk 7/11" },
        { fill: "#64748b", text: "  ·  " },
        { fill: "#0072B2", text: "✕ Bearer 8/11" },
      ],
      extraLines: ["stop before route / API depth"],
    },
    {
      branchColor: "#64748b",
      lines: ["No other evaluated tool reaches this depth"],
    },
    null,
  ];

  function nodeHeight(lineCount) {
    const padT = 12;
    const padB = 14;
    const titleLine = 16;
    const subLine = 14;
    return padT + titleLine + (lineCount > 1 ? 3 + (lineCount - 1) * subLine : 0) + padB;
  }

  function appendTspanLine(svg, x, y, tspans, fontSize, weight) {
    const t = el(
      "text",
      {
        x: String(x),
        y: String(y),
        "text-anchor": "start",
        "font-family": "system-ui,Segoe UI,Roboto,sans-serif",
        "font-size": String(fontSize),
        "font-weight": weight,
      },
      []
    );
    for (const p of tspans) {
      t.appendChild(
        el(
          "tspan",
          {
            fill: p.fill,
            "font-weight": p.bold ? "700" : weight,
          },
          [p.text]
        )
      );
    }
    svg.appendChild(t);
  }

  function drawStopCallout(svg, opts) {
    const {
      midY,
      spineX,
      lineEndX,
      xGlyphX,
      textX,
      branchColor,
      lines,
      tspans,
      extraLines,
      edgeFs,
      subFs,
    } = opts;

    svg.appendChild(
      el("line", {
        x1: String(spineX),
        y1: String(midY),
        x2: String(lineEndX),
        y2: String(midY),
        stroke: branchColor,
        "stroke-width": "2",
        "stroke-linecap": "round",
      })
    );

    const xr = 6;
    svg.appendChild(
      el("path", {
        d: `M${xGlyphX - xr},${midY - xr} L${xGlyphX + xr},${midY + xr} M${xGlyphX + xr},${midY - xr} L${xGlyphX - xr},${midY + xr}`,
        stroke: branchColor,
        "stroke-width": "2.25",
        fill: "none",
        "stroke-linecap": "round",
      })
    );

    let ty = midY + 5 - (tspans || lines ? 0 : 0);
    const linePitch = 15;

    if (tspans && tspans.length) {
      appendTspanLine(svg, textX, ty, tspans, edgeFs, "600");
      ty += linePitch + 2;
    } else if (lines && lines.length) {
      for (const line of lines) {
        svg.appendChild(
          el(
            "text",
            {
              x: String(textX),
              y: String(ty),
              "text-anchor": "start",
              "font-family": "system-ui,Segoe UI,Roboto,sans-serif",
              "font-size": edgeFs,
              "font-weight": "600",
              fill: "#334155",
            },
            [line]
          )
        );
        ty += linePitch;
      }
    }

    if (extraLines) {
      for (const line of extraLines) {
        svg.appendChild(
          el(
            "text",
            {
              x: String(textX),
              y: String(ty),
              "text-anchor": "start",
              "font-family": "system-ui,Segoe UI,Roboto,sans-serif",
              "font-size": subFs,
              "font-weight": "500",
              fill: "#64748b",
            },
            [line]
          )
        );
        ty += linePitch - 1;
      }
    }
  }

  function renderAnalysisDepthDiagram(container) {
    if (!container || container.getAttribute("data-rendered") === "1") return;
    container.setAttribute("data-rendered", "1");

    const nodeW = 262;
    const nodeX = 14;
    const cx = nodeX + nodeW / 2;
    const lineEndX = nodeX + nodeW + 18;
    const xGlyphX = lineEndX + 10;
    const textX = xGlyphX + 14;
    const W = 628;
    const edgeGap = 34;
    const titleFs = "12.5";
    const subFs = "9.5";
    /** Right-side stop callouts (branch + ✕ + copy) */
    const edgeCalloutFs = "14";
    const edgeCalloutSubFs = "12";

    const layout = [];
    let y = 8;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const h = nodeHeight(n.lines.length);
      layout.push({ y, h, n });
      y += h;
      if (i < nodes.length - 1) y += edgeGap;
    }

    const H = y + 10;
    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      height: "auto",
      role: "presentation",
      "aria-hidden": "true",
    });

    const mid = "analysis-depth-arrowhead";
    svg.appendChild(
      el("defs", {}, [
        el(
          "marker",
          {
            id: mid,
            markerWidth: "7",
            markerHeight: "7",
            refX: "6",
            refY: "3.5",
            orient: "auto",
          },
          [el("path", { d: "M0,0 L7,3.5 L0,7 Z", fill: "#64748b" })]
        ),
      ])
    );

    for (let i = 0; i < layout.length; i++) {
      const { y: ny, h, n } = layout[i];
      const t = themes[n.key];
      svg.appendChild(
        el("rect", {
          x: String(nodeX),
          y: String(ny),
          width: String(nodeW),
          height: String(h),
          rx: "8",
          fill: t.fill,
          stroke: t.stroke,
          "stroke-width": t.sw,
        })
      );

      let baseline = ny + 23;
      n.lines.forEach((line, li) => {
        const fs = li === 0 ? titleFs : subFs;
        const weight = li === 0 ? "700" : "500";
        const fill = li === 0 ? "#0f172a" : "#334155";
        svg.appendChild(
          el(
            "text",
            {
              x: String(cx),
              y: String(baseline),
              "text-anchor": "middle",
              "font-family": "system-ui,Segoe UI,Roboto,sans-serif",
              "font-size": fs,
              "font-weight": weight,
              fill,
            },
            [line]
          )
        );
        baseline += li === 0 ? 17 : 14;
      });

      if (i < layout.length - 1) {
        const y1 = ny + h;
        const y2 = layout[i + 1].y;
        svg.appendChild(
          el("line", {
            x1: String(cx),
            y1: String(y1),
            x2: String(cx),
            y2: String(y2),
            stroke: "#94a3b8",
            "stroke-width": "1.25",
            "marker-end": `url(#${mid})`,
          })
        );

        const callout = edgeCallouts[i];
        if (callout) {
          const midY = (y1 + y2) / 2;
          drawStopCallout(svg, {
            midY,
            spineX: cx,
            lineEndX,
            xGlyphX,
            textX,
            branchColor: callout.branchColor,
            lines: callout.lines,
            tspans: callout.tspans,
            extraLines: callout.extraLines,
            edgeFs: edgeCalloutFs,
            subFs: edgeCalloutSubFs,
          });
        }
      }
    }

    container.appendChild(svg);
  }

  function init() {
    const root = document.getElementById("analysis-depth-diagram");
    if (root) renderAnalysisDepthDiagram(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
