/**
 * Runtime scan flow: abridged summary cards for the landing page.
 */
(function () {
  "use strict";

  var ABRIDGED_STAGES = [
    {
      title: "CLI",
      detail: "parseCliArgs, .vibescanrc, collectScanFiles, read sources",
    },
    {
      title: "scanProjectAsync",
      detail: "Scanner entry — unified project scan",
    },
    {
      title: "Init & pre-scan",
      detail: "TS program or parser-only, parse all files, extract Express + Next routes",
    },
    {
      title: "Per-file loop",
      detail: "Analysis units, rule engine, taint, routes, app-level audit, thresholds",
    },
    {
      title: "Cross-file",
      detail: "Middleware, webhooks, OpenAPI drift, route posture, third-party surface",
    },
    {
      title: "Output",
      detail: "Suppressions, baseline, gates, sidecars, exports — JSON, SARIF, HTML, human",
    },
    {
      title: "Optional proof",
      detail: "emitProofTests, optional node:test harness",
    },
  ];

  function el(tag, className, attrs) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") n.textContent = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    }
    return n;
  }

  function mount(root) {
    var abWrap = el("div", "scanFlowAbridged", { role: "group", "aria-label": "Scan pipeline summary" });
    ABRIDGED_STAGES.forEach(function (stage, i) {
      if (i > 0) abWrap.appendChild(el("span", "scanFlowAbridgedArrow", { "aria-hidden": "true", text: "↓" }));
      var card = el("article", "scanFlowAbridgedCard");
      card.appendChild(el("h3", "scanFlowAbridgedTitle", { text: stage.title }));
      card.appendChild(el("p", "scanFlowAbridgedDetail", { text: stage.detail }));
      abWrap.appendChild(card);
    });
    root.appendChild(abWrap);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("runtimeScanFlowMount");
    if (root) mount(root);
  });
})();
