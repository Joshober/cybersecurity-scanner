/**
 * Figure 4 - Overall performance ranking (recall), lollipop chart.
 * Designed for high readability on poster printouts.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const FONT = "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const TOOL_COLORS = {
    vibescan: "#009E73",
    bearer: "#0072B2",
    "snyk-code": "#E69F00",
    codeql: "#CC79A7",
    semgrep: "#D55E00",
  };

  const ROWS = [
    { id: "vibescan", label: "VibeScan", pct: 100.0 },
    { id: "bearer", label: "Bearer", pct: 72.7 },
    { id: "snyk-code", label: "Snyk Code", pct: 63.6 },
    { id: "codeql", label: "CodeQL", pct: 54.5 },
    { id: "semgrep", label: "Semgrep", pct: 36.4 },
  ];

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

  function formatPct(value) {
    return `${value.toFixed(1)}%`;
  }

  function render(container) {
    if (!container || container.getAttribute("data-rendered") === "1") return;
    container.setAttribute("data-rendered", "1");
    container.replaceChildren();

    const W = 640;
    const padL = 138;
    const padR = 56;
    const padT = 14;
    const padB = 56;
    const rowH = 36;
    const rowCount = ROWS.length;
    const plotTop = padT;
    const plotH = rowCount * rowH;
    const axisY = plotTop + plotH + 4;
    const H = axisY + padB;
    const innerW = W - padL - padR;

    const xToPx = (pct) => padL + (pct / 100) * innerW;

    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      height: "auto",
      "aria-hidden": "true",
      focusable: "false",
    });

    svg.appendChild(el("rect", { x: "0", y: "0", width: String(W), height: String(H), fill: "#ffffff" }));

    for (let i = 0; i < rowCount; i += 1) {
      if (i % 2 === 1) {
        const y = plotTop + i * rowH;
        svg.appendChild(
          el("rect", {
            x: String(padL),
            y: String(y),
            width: String(innerW),
            height: String(rowH),
            fill: "#f8fafc",
          })
        );
      }
    }

    const ticks = [0, 20, 40, 60, 80, 100];
    ticks.forEach((tick) => {
      const x = xToPx(tick);
      svg.appendChild(
        el("line", {
          x1: String(x),
          y1: String(plotTop),
          x2: String(x),
          y2: String(axisY),
          stroke: "#e2e8f0",
          "stroke-width": "1",
        })
      );
      svg.appendChild(
        el(
          "text",
          {
            x: String(x),
            y: String(axisY + 18),
            "text-anchor": "middle",
            "font-family": FONT,
            "font-size": "10",
            "font-weight": "500",
            fill: "#475569",
          },
          [`${tick}%`]
        )
      );
    });

    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(plotTop),
        x2: String(padL),
        y2: String(axisY),
        stroke: "#334155",
        "stroke-width": "1.5",
      })
    );
    svg.appendChild(
      el("line", {
        x1: String(padL),
        y1: String(axisY),
        x2: String(padL + innerW),
        y2: String(axisY),
        stroke: "#334155",
        "stroke-width": "1.5",
      })
    );

    svg.appendChild(
      el(
        "text",
        {
          x: String(padL + innerW / 2),
          y: String(H - 8),
          "text-anchor": "middle",
          "font-family": FONT,
          "font-size": "11",
          "font-weight": "600",
          fill: "#0f172a",
        },
        ["Recall (%)"]
      )
    );

    ROWS.forEach((row, index) => {
      const y = plotTop + index * rowH + rowH / 2;
      const cx = xToPx(row.pct);
      const color = TOOL_COLORS[row.id] || "#64748b";
      const rankLabel = `#${index + 1} ${row.label}`;

      svg.appendChild(
        el(
          "text",
          {
            x: String(padL - 10),
            y: String(y + 4),
            "text-anchor": "end",
            "font-family": FONT,
            "font-size": "11",
            "font-weight": index === 0 ? "700" : "600",
            fill: "#0f172a",
          },
          [rankLabel]
        )
      );

      svg.appendChild(
        el("line", {
          x1: String(padL),
          y1: String(y),
          x2: String(cx),
          y2: String(y),
          stroke: color,
          "stroke-width": "3",
          "stroke-linecap": "round",
        })
      );

      svg.appendChild(
        el("circle", {
          cx: String(cx),
          cy: String(y),
          r: "8",
          fill: color,
          stroke: "#ffffff",
          "stroke-width": "2",
        })
      );

      const valueText = formatPct(row.pct);
      const placeLeft = row.pct >= 92;
      svg.appendChild(
        el(
          "text",
          {
            x: String(placeLeft ? cx - 12 : cx + 12),
            y: String(y + 4),
            "text-anchor": placeLeft ? "end" : "start",
            "font-family": FONT,
            "font-size": "10.5",
            "font-weight": "700",
            fill: "#1e293b",
            stroke: "#ffffff",
            "stroke-width": "3",
            "paint-order": "stroke fill",
            "font-variant-numeric": "tabular-nums",
          },
          [valueText]
        )
      );
    });

    container.appendChild(svg);
  }

  function init() {
    const root = document.getElementById("figure-4-ranking-chart");
    if (root) render(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
