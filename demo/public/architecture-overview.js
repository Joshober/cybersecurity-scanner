/**
 * Architecture overview: abridged summary cards for the landing page.
 */
(function () {
  "use strict";

  var ABRIDGED_STAGES = [
    {
      title: "Input",
      detail: "Source code + configuration",
    },
    {
      title: "Analysis core",
      detail: "Unified parse, rule-based detection, and taint analysis",
    },
    {
      title: "Novel contributions",
      detail: "Cross-file reasoning, reporting & proofs, CI validation",
    },
    {
      title: "DVNA benchmark",
      detail: "11/11 recall with executable proof validation",
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
    var abWrap = el("div", "scanFlowAbridged", { role: "group", "aria-label": "Architecture summary" });
    ABRIDGED_STAGES.forEach(function (stage) {
      var card = el("article", "scanFlowAbridgedCard");
      card.appendChild(el("h3", "scanFlowAbridgedTitle", { text: stage.title }));
      card.appendChild(el("p", "scanFlowAbridgedDetail", { text: stage.detail }));
      abWrap.appendChild(card);
    });
    root.appendChild(abWrap);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("architectureOverviewMount");
    if (root) mount(root);
  });
})();
