/**
 * Figure 3 - Recall vs. Raw Alert Volume (DVNA).
 * Inline SVG with print-friendly sizing and high-contrast labeling.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const FONT = "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const TOOL_COLORS = {
    vibescan: "#009E73",
    bearer: "#0072B2",
    "snyk-code": "#E69F00",
    semgrep: "#D55E00",
    codeql: "#CC79A7",
    "eslint-security": "#56B4E9",
  };

  const POINTS = [
    { id: "vibescan", label: "VibeScan", issues: 25, recall: 100.0 },
    { id: "bearer", label: "Bearer", issues: 31, recall: 72.7 },
    { id: "snyk-code", label: "Snyk Code", issues: 36, recall: 63.6 },
    { id: "codeql", label: "CodeQL", issues: 46, recall: 54.5 },
    { id: "semgrep", label: "Semgrep", issues: 11, recall: 36.4 },
    { id: "eslint-security", label: "eslint-plugin-security", issues: 493, recall: 9.1 },
  ];

  const X_TICKS = [10, 20, 30, 50, 100, 200, 500];
  const Y_TICKS = [0, 20, 40, 60, 80, 100];

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

  function log10x1(v) {
    return Math.log10(v + 1);
  }

  function render(container) {
    if (!container || container.getAttribute("data-rendered") === "1") return;
    container.setAttribute("data-rendered", "1");
    container.replaceChildren();

    const W = 640;
    const H = 360;
    const padL = 60;
    const padR = 24;
    const padT = 22;
    const padB = 58;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const xMin = log10x1(10);
    const xMax = log10x1(500);
    const yMin = 0;
    const yMax = 100;

    const xToPx = (raw) => padL + ((log10x1(raw) - xMin) / (xMax - xMin)) * innerW;
    const yToPx = (pct) => padT + (1 - (pct - yMin) / (yMax - yMin)) * innerH;

    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      height: "auto",
      "aria-hidden": "true",
      focusable: "false",
    });

    svg.appendChild(el("rect", { x: "0", y: "0", width: String(W), height: String(H), fill: "#ffffff" }));
    svg.appendChild(
      el("rect", {
        x: String(padL),
        y: String(padT),
        width: String(innerW),
        height: String(innerH),
        fill: "#fbfdff",
      })
    );

    X_TICKS.forEach((tick) => {
      const x = xToPx(tick);
      svg.appendChild(
        el("line", {
          x1: String(x),
          y1: String(padT),
          x2: String(x),
          y2: String(padT + innerH),
          stroke: "#e2e8f0",
          "stroke-width": "1",
        })
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(x),
            y: String(H - 24),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": "10",
            "font-weight": "500",
            fill: "#475569",
          },
          [String(tick)]
        )
      );
    });

    Y_TICKS.forEach((tick) => {
      const y = yToPx(tick);
      svg.appendChild(
        el("line", {
          x1: String(padL),
          y1: String(y),
          x2: String(padL + innerW),
          y2: String(y),
          stroke: "#e2e8f0",
          "stroke-width": "1",
        })
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(padL - 8),
            y: String(y + 3.5),
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
        y2: String(padT + innerH),
        stroke: "#334155",
        "stroke-width": "1.5",
      })
    );
    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(padT + innerH),
        x2: String(padL + innerW),
        y2: String(padT + innerH),
        stroke: "#334155",
        "stroke-width": "1.5",
      })
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String((padL + innerW + padL) / 2),
          y: String(H - 6),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "11",
          "font-weight": "600",
          fill: "#0f172a",
        },
        ["Raw alert volume on DVNA (issue count; logarithmic scale)"]
      )
    );

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
          "font-size": "11",
          "font-weight": "600",
          fill: "#0f172a",
          transform: `rotate(-90 ${yLabelX} ${yLabelY})`,
        },
        ["Recall (%)"]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(padL + innerW),
          y: String(padT - 8),
          "text-anchor": "end",
          "font-family": FONT,
          "font-size": "10",
          "font-weight": "600",
          fill: "#1e293b",
        },
        ["Pearson r = -0.73"]
      )
    );

    const labelOffsets = {
      vibescan: { dx: 10, dy: -9, anchor: "start" },
      bearer: { dx: 10, dy: -6, anchor: "start" },
      "snyk-code": { dx: 10, dy: 12, anchor: "start" },
      codeql: { dx: 10, dy: 22, anchor: "start" },
      semgrep: { dx: 10, dy: -8, anchor: "start" },
      "eslint-security": { dx: -10, dy: -8, anchor: "end" },
    };

    POINTS.forEach((point) => {
      const cx = xToPx(point.issues);
      const cy = yToPx(point.recall);
      const color = TOOL_COLORS[point.id] || "#64748b";
      const labelCfg = labelOffsets[point.id] || { dx: 10, dy: -8, anchor: "start" };

      svg.appendChild(
        el("circle", {
          cx: String(cx),
          cy: String(cy),
          r: "6",
          fill: color,
          stroke: "#ffffff",
          "stroke-width": "2",
        })
      );

      svg.appendChild(
        el(
          "text",
          {
            x: String(cx + labelCfg.dx),
            y: String(cy + labelCfg.dy),
            "text-anchor": labelCfg.anchor,
            "font-family": FONT,
            "font-size": "10",
            "font-weight": "600",
            fill: "#0f172a",
            stroke: "#ffffff",
            "stroke-width": "3",
            "paint-order": "stroke fill",
          },
          [point.label]
        )
      );
    });

    container.appendChild(svg);
  }

  function init() {
    const root = document.getElementById("figure-3-recall-vs-alerts-chart");
    if (root) render(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
