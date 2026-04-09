/**
 * Renders Figure 1 — Analysis depth pipeline (peer tools vs VibeScan) as SVG.
 * Semantics match docs/vibescan/comparison-overview.mmd
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

  /** Per edge: string or [line1, line2]; empty string / empty array = no label */
  const edgeLabels = [
    "eslint-plugin-security stops · 1/11 · 493 alerts",
    "Semgrep stops · 4/11 · 11 alerts",
    ["CodeQL 6/11 · Snyk 7/11 · Bearer 8/11", "stop before route / API depth"],
    "No other evaluated tool reaches this depth",
    "",
  ];

  function nodeHeight(lineCount) {
    const padT = 10;
    const padB = 10;
    const titleLine = 12;
    const subLine = 11;
    return padT + titleLine + (lineCount > 1 ? 2 + (lineCount - 1) * subLine : 0) + padB;
  }

  function renderAnalysisDepthDiagram(container) {
    if (!container || container.getAttribute("data-rendered") === "1") return;
    container.setAttribute("data-rendered", "1");

    const W = 300;
    const nodeW = 262;
    const nodeX = (W - nodeW) / 2;
    const cx = W / 2;
    const edgeGap = 34;
    const titleFs = "10";
    const subFs = "7.5";
    const edgeFs = "7";

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
        el("marker", {
          id: mid,
          markerWidth: "7",
          markerHeight: "7",
          refX: "6",
          refY: "3.5",
          orient: "auto",
        }, [el("path", { d: "M0,0 L7,3.5 L0,7 Z", fill: "#64748b" })]),
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

      let baseline = ny + 20;
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
        baseline += li === 0 ? 14 : 11;
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

        const label = edgeLabels[i];
        const lines = !label
          ? []
          : Array.isArray(label)
            ? label
            : [label];
        if (lines.length) {
          const midY = (y1 + y2) / 2;
          const linePitch = 8;
          let ty = midY + 3 - ((lines.length - 1) * linePitch) / 2;
          for (const line of lines) {
            svg.appendChild(
              el(
                "text",
                {
                  x: String(cx),
                  y: String(ty),
                  "text-anchor": "middle",
                  "font-family": "system-ui,Segoe UI,Roboto,sans-serif",
                  "font-size": edgeFs,
                  fill: "#475569",
                },
                [line]
              )
            );
            ty += linePitch;
          }
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
