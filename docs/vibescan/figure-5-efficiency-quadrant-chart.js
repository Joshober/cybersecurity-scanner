/**
 * Figure 5 - Scanner efficiency chart (recall vs runtime).
 * Uses measured runtimes from results/dvna-detection-matrix.json values.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const FONT = "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const DATA = [
    { id: "vibescan", label: "VibeScan", recall: 100.0, runtimeMs: 805.47, color: "#009E73" },
    { id: "bearer", label: "Bearer", recall: 72.7, runtimeMs: 10848.7, color: "#0072B2" },
    { id: "snyk-code", label: "Snyk Code", recall: 63.6, runtimeMs: 9598.26, color: "#E69F00" },
    { id: "codeql", label: "CodeQL", recall: 54.5, runtimeMs: 91816.44, color: "#CC79A7" },
    { id: "semgrep", label: "Semgrep", recall: 36.4, runtimeMs: 15240.14, color: "#D55E00" },
    { id: "eslint-security", label: "ESLint", recall: 9.1, runtimeMs: 1704.57, color: "#56B4E9" },
  ];

  const X_TICK_SECONDS = [90, 40, 20, 10, 5, 2, 1, 0.8];
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

  function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function render(container) {
    if (!container || container.getAttribute("data-rendered") === "1") return;
    container.setAttribute("data-rendered", "1");
    container.replaceChildren();

    const W = 660;
    const H = 360;
    const padL = 68;
    const padR = 28;
    const padT = 22;
    const padB = 66;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const runtimes = DATA.map((row) => row.runtimeMs);
    const recalls = DATA.map((row) => row.recall);
    const runtimeMin = Math.min(...runtimes);
    const runtimeMax = Math.max(...runtimes);
    const recallMin = 0;
    const recallMax = 100;

    const logMin = Math.log10(runtimeMin);
    const logMax = Math.log10(runtimeMax);

    const xToPx = (runtimeMs) => {
      const t = (Math.log10(runtimeMs) - logMin) / (logMax - logMin);
      return padL + (1 - t) * innerW;
    };
    const yToPx = (recall) => padT + (1 - (recall - recallMin) / (recallMax - recallMin)) * innerH;

    const medianRuntime = median(runtimes);
    const medianRecall = median(recalls);

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

    const bestZoneX = xToPx(medianRuntime);
    const bestZoneY = yToPx(medianRecall);
    svg.appendChild(
      el("rect", {
        x: String(bestZoneX),
        y: String(padT),
        width: String(padL + innerW - bestZoneX),
        height: String(bestZoneY - padT),
        fill: "#ecfdf5",
      })
    );

    X_TICK_SECONDS.forEach((seconds) => {
      const runtimeMs = seconds * 1000;
      if (runtimeMs < runtimeMin || runtimeMs > runtimeMax) return;
      const x = xToPx(runtimeMs);
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
            y: String(H - 30),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": "10",
            "font-weight": "500",
            fill: "#475569",
            "font-variant-numeric": "tabular-nums",
          },
          [String(seconds)]
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

    const medianX = xToPx(medianRuntime);
    const medianY = yToPx(medianRecall);
    svg.appendChild(
      el("line", {
        x1: String(medianX),
        y1: String(padT),
        x2: String(medianX),
        y2: String(padT + innerH),
        stroke: "#64748b",
        "stroke-width": "1.2",
        "stroke-dasharray": "5 4",
      })
    );
    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(medianY),
        x2: String(padL + innerW),
        y2: String(medianY),
        stroke: "#64748b",
        "stroke-width": "1.2",
        "stroke-dasharray": "5 4",
      })
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(medianX - 6),
          y: String(padT + 12),
          "text-anchor": "end",
          "font-family": FONT,
          "font-size": "9",
          "font-weight": "600",
          fill: "#334155",
        },
        ["Median runtime"]
      )
    );
    svg.appendChild(
      el(
        "text",
        {
          x: String(padL + 6),
          y: String(medianY - 6),
          "text-anchor": "start",
          "font-family": FONT,
          "font-size": "9",
          "font-weight": "600",
          fill: "#334155",
        },
        ["Median recall"]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(padL + innerW - 6),
          y: String(padT + 14),
          "text-anchor": "end",
          "font-family": FONT,
          "font-size": "10",
          "font-weight": "700",
          fill: "#166534",
        },
        ["Best zone: higher recall + faster runtime"]
      )
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(W / 2),
          y: String(H - 8),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "11",
          "font-weight": "600",
          fill: "#0f172a",
        },
        ["Runtime on DVNA (seconds, log scale, slower to faster)"]
      )
    );

    const yLabelX = 18;
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

    const labelOffsets = {
      vibescan: { dx: -10, dy: 14, anchor: "end" },
      bearer: { dx: 10, dy: -14, anchor: "start" },
      "snyk-code": { dx: 10, dy: 14, anchor: "start" },
      codeql: { dx: 10, dy: -8, anchor: "start" },
      semgrep: { dx: 10, dy: 14, anchor: "start" },
      "eslint-security": { dx: 10, dy: -10, anchor: "start" },
    };

    DATA.forEach((row) => {
      const cx = xToPx(row.runtimeMs);
      const cy = yToPx(row.recall);
      const labelCfg = labelOffsets[row.id] || { dx: 10, dy: -8, anchor: "start" };

      svg.appendChild(
        el("circle", {
          cx: String(cx),
          cy: String(cy),
          r: row.id === "vibescan" ? "7" : "6",
          fill: row.color,
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
            "font-size": row.id === "vibescan" ? "11" : "10",
            "font-weight": row.id === "vibescan" ? "700" : "600",
            fill: "#0f172a",
            stroke: "#ffffff",
            "stroke-width": "3",
            "paint-order": "stroke fill",
          },
          [row.label]
        )
      );
    });

    container.appendChild(svg);
  }

  function init() {
    const root = document.getElementById("figure-5-efficiency-quadrant-chart");
    if (root) render(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
