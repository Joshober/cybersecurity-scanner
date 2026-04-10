/**
 * Figure 5 - Scanner efficiency chart (recall vs runtime).
 * Uses measured runtimes from results/dvna-detection-matrix.json values.
 * Canvas 640×360 matches Figure 3 (recall vs alerts) for identical poster sizing / viewBox.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const FONT = "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  /** Design size (same as figure-3-recall-vs-alerts-chart.js). */
  const W0 = 640;
  const H0 = 360;

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

  function buildSvg(W, H) {
    const sx = W / W0;
    const sy = H / H0;
    const s = Math.min(sx, sy);

    const padL = 66 * sx;
    const padR = 27 * sx;
    const padT = 31 * sy;
    const padB = 57 * sy;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const plotBottom = padT + innerH;

    const runtimes = DATA.map((row) => row.runtimeMs);
    const recalls = DATA.map((row) => row.recall);
    const runtimeMin = Math.min(...runtimes);
    const runtimeMax = Math.max(...runtimes);
    const recallMin = 0;
    const recallMax = 100;

    const runtimePadFactor = 1.2;
    const runtimeDomainMin = runtimeMin / runtimePadFactor;
    const runtimeDomainMax = runtimeMax * runtimePadFactor;
    const recallDomainMin = recallMin - 25;
    const recallDomainMax = recallMax + 45;

    const logMin = Math.log10(runtimeDomainMin);
    const logMax = Math.log10(runtimeDomainMax);

    const xToPx = (runtimeMs) => {
      const t = (Math.log10(runtimeMs) - logMin) / (logMax - logMin);
      return padL + (1 - t) * innerW;
    };
    const yToPx = (recall) =>
      padT + (1 - (recall - recallDomainMin) / (recallDomainMax - recallDomainMin)) * innerH;

    const medianRuntime = median(runtimes);
    const medianRecall = median(recalls);

    const fsTick = Math.max(7, 10 * s);
    const fsAxis = Math.max(8, 11 * s);
    const fsQuad = Math.max(7, 10 * s);
    const fsPoint = Math.max(8, 10 * s);
    const fsVibe = Math.max(9, 11 * s);
    const swGrid = Math.max(0.6, 1 * s);
    const swAxis = Math.max(1, 1.5 * s);
    const swMedian = Math.max(0.9, 1.2 * s);
    const dashMed = `${5 * s} ${4 * s}`;
    const rVibe = Math.max(4.5, 7 * s);
    const rPt = Math.max(4, 6 * s);
    const swPointStroke = Math.max(1.2, 2 * s);
    const swLabelHalo = Math.max(2, 3 * s);

    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      height: "auto",
      preserveAspectRatio: "xMidYMid meet",
      style: "display:block;width:100%;height:auto;",
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

    const xTickY = plotBottom + 11 * sy;
    X_TICK_SECONDS.forEach((seconds) => {
      const runtimeMs = seconds * 1000;
      if (runtimeMs < runtimeDomainMin || runtimeMs > runtimeDomainMax) return;
      const x = xToPx(runtimeMs);
      svg.appendChild(
        el("line", {
          x1: String(x),
          y1: String(padT),
          x2: String(x),
          y2: String(padT + innerH),
          stroke: "#e2e8f0",
          "stroke-width": String(swGrid),
        })
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(x),
            y: String(xTickY),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": String(fsTick),
            "font-weight": "500",
            fill: "#475569",
            "font-variant-numeric": "tabular-nums",
          },
          [String(seconds)]
        )
      );
    });

    const yTickDx = 8 * sx;
    const yTickDy = 3.5 * sy;
    Y_TICKS.forEach((tick) => {
      const y = yToPx(tick);
      svg.appendChild(
        el("line", {
          x1: String(padL),
          y1: String(y),
          x2: String(padL + innerW),
          y2: String(y),
          stroke: "#e2e8f0",
          "stroke-width": String(swGrid),
        })
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(padL - yTickDx),
            y: String(y + yTickDy),
            "text-anchor": "end",
            "font-family": FONT,
            "font-size": String(fsTick),
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
        "stroke-width": String(swAxis),
      })
    );
    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(padT + innerH),
        x2: String(padL + innerW),
        y2: String(padT + innerH),
        stroke: "#334155",
        "stroke-width": String(swAxis),
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
        "stroke-width": String(swMedian),
        "stroke-dasharray": dashMed,
      })
    );
    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(medianY),
        x2: String(padL + innerW),
        y2: String(medianY),
        stroke: "#64748b",
        "stroke-width": String(swMedian),
        "stroke-dasharray": dashMed,
      })
    );

    const qOffT = 12 * sy;
    const qOffB = 5 * sy;
    const qOffX = 8 * sx;
    const qCornerTop = padT + qOffT;
    const qCornerBot = padT + innerH - qOffB;
    const qCornerL = padL + qOffX;
    const qCornerR = padL + innerW - qOffX;

    svg.appendChild(
      el(
        "text",
        {
          x: String(qCornerL),
          y: String(qCornerTop),
          "text-anchor": "start",
          "font-family": FONT,
          "font-size": String(fsQuad),
          "font-weight": "800",
          fill: "#c2410c",
        },
        ["High recall / Slow"]
      )
    );
    svg.appendChild(
      el(
        "text",
        {
          x: String(qCornerR),
          y: String(qCornerTop),
          "text-anchor": "end",
          "font-family": FONT,
          "font-size": String(fsQuad),
          "font-weight": "800",
          fill: "#047857",
        },
        ["Best zone: higher recall + faster runtime"]
      )
    );
    svg.appendChild(
      el(
        "text",
        {
          x: String(qCornerL),
          y: String(qCornerBot),
          "text-anchor": "start",
          "font-family": FONT,
          "font-size": String(fsQuad),
          "font-weight": "800",
          fill: "#6d28d9",
        },
        ["Low recall / Slow"]
      )
    );
    svg.appendChild(
      el(
        "text",
        {
          x: String(qCornerR),
          y: String(qCornerBot),
          "text-anchor": "end",
          "font-family": FONT,
          "font-size": String(fsQuad),
          "font-weight": "800",
          fill: "#0369a1",
        },
        ["Low recall / Fast"]
      )
    );

    const tickToTitle = Math.max(5, 7 * s);
    const bottomEdgePad = Math.max(10, 11 * s);
    let xTitleY = H - bottomEdgePad;
    const minTitleY = xTickY + fsTick * 0.85 + tickToTitle;
    if (xTitleY < minTitleY) xTitleY = minTitleY;

    svg.appendChild(
      el(
        "text",
        {
          x: String(W / 2),
          y: String(xTitleY),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": String(fsAxis),
          "font-weight": "600",
          fill: "#0f172a",
        },
        ["Runtime on DVNA (seconds, log scale; left = slower, right = faster)"]
      )
    );

    const yLabelX = 18 * sx;
    const yLabelY = padT + innerH / 2;
    svg.appendChild(
      el(
        "text",
        {
          x: String(yLabelX),
          y: String(yLabelY),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": String(fsAxis),
          "font-weight": "600",
          fill: "#0f172a",
          transform: `rotate(-90 ${yLabelX} ${yLabelY})`,
        },
        ["Recall (%)"]
      )
    );

    const labelOffsets = {
      vibescan: { dx: -10 * sx, dy: 20 * sy, anchor: "end" },
      bearer: { dx: 10 * sx, dy: -14 * sy, anchor: "start" },
      "snyk-code": { dx: 10 * sx, dy: 14 * sy, anchor: "start" },
      codeql: { dx: 10 * sx, dy: -8 * sy, anchor: "start" },
      semgrep: { dx: 10 * sx, dy: 14 * sy, anchor: "start" },
      "eslint-security": { dx: 10 * sx, dy: -10 * sy, anchor: "start" },
    };

    DATA.forEach((row) => {
      const cx = xToPx(row.runtimeMs);
      const cy = yToPx(row.recall);
      const labelCfg = labelOffsets[row.id] || { dx: 10 * sx, dy: -8 * sy, anchor: "start" };

      svg.appendChild(
        el("circle", {
          cx: String(cx),
          cy: String(cy),
          r: String(row.id === "vibescan" ? rVibe : rPt),
          fill: row.color,
          stroke: "#ffffff",
          "stroke-width": String(swPointStroke),
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
            "font-size": String(row.id === "vibescan" ? fsVibe : fsPoint),
            "font-weight": row.id === "vibescan" ? "700" : "600",
            fill: "#0f172a",
            stroke: "#ffffff",
            "stroke-width": String(swLabelHalo),
            "paint-order": "stroke fill",
          },
          [row.label]
        )
      );
    });

    return svg;
  }

  function drawInto(container) {
    const svg = buildSvg(W0, H0);
    container.replaceChildren(svg);
  }

  function init() {
    const root = document.getElementById("figure-5-efficiency-quadrant-chart");
    if (!root) return;

    root.style.width = "100%";
    root.style.boxSizing = "border-box";

    drawInto(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
