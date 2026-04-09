(function () {
  "use strict";

  /** Mirrors demo/public/assets/diagrams/comparison-overview.mmd */
  var FLOW = [
    {
      type: "step",
      key: "s1",
      title: "Pattern matching",
      desc: "AST node-level checks",
      theme: "basic",
      filterId: "eslint",
      filterLabel: "eslint-plugin-security",
    },
    {
      type: "bridge",
      text:
        "eslint-plugin-security stops here · benchmark recall 1/11 · 493 alerts on evaluated set",
      filterId: "eslint",
    },
    {
      type: "step",
      key: "s2",
      title: "Taint / data flow",
      desc: "Source-to-sink tracking within files",
      theme: "flow",
      filterId: "semgrep",
      filterLabel: "Semgrep",
    },
    {
      type: "bridge",
      text: "Semgrep stops here · 4/11 recall · 11 alerts",
      filterId: "semgrep",
    },
    {
      type: "step",
      key: "s3",
      title: "Cross-file analysis",
      desc: "Inter-procedural and type-aware resolution",
      theme: "cross",
      filterId: "sast-mid",
      filterLabel: "CodeQL · Snyk Code · Bearer",
    },
    {
      type: "bridge",
      text: "CodeQL 6/11 · Snyk Code 7/11 · Bearer 8/11 stop before the next stage",
      filterId: "sast-mid",
    },
    {
      type: "step",
      key: "s4",
      title: "Route + API reasoning",
      desc: "Framework routes, API drift, trust boundaries",
      theme: "advanced",
      filterId: "preproof",
      filterLabel: "Deepest competing tools",
    },
    {
      type: "bridge",
      text: "No other evaluated tool in this benchmark reaches proof generation + CI gates",
      filterId: "preproof",
    },
    {
      type: "step",
      key: "s5",
      title: "Proof generation + CI gates",
      desc: "Auto-generated tests and recall regression enforcement",
      theme: "unique",
      filterId: "vibescan",
      filterLabel: "VibeScan pipeline",
    },
    {
      type: "step",
      key: "vs",
      title: "VibeScan",
      desc: "11/11 recall · 25 alerts — only tool at full depth in this evaluation",
      theme: "vibescan",
      filterId: "vibescan",
      filterLabel: "VibeScan",
      isFinal: true,
    },
  ];

  var FILTER_OPTIONS = [
    { id: "all", label: "Full depth stack", help: "Show every stage equally" },
    { id: "eslint", label: "eslint-plugin-security", help: "Typical ceiling: pattern matching" },
    { id: "semgrep", label: "Semgrep", help: "Typical ceiling: taint within files" },
    { id: "sast-mid", label: "CodeQL · Snyk · Bearer", help: "Typical ceiling: cross-file stage" },
    { id: "preproof", label: "Other tools max", help: "Highlight route/API depth before proofs" },
    { id: "vibescan", label: "VibeScan", help: "Emphasize proof + CI and full pipeline" },
  ];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "className") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c != null) node.appendChild(c);
    });
    return node;
  }

  function buildToolbar(root) {
    var fieldset = el("fieldset", { className: "comparisonDepthToolbar", "aria-describedby": "comparison-depth-toolbar-hint" });
    fieldset.appendChild(el("legend", { className: "comparisonDepthToolbarLegend", text: "Highlight a comparison" }));
    var hint = el("p", {
      id: "comparison-depth-toolbar-hint",
      className: "comparisonDepthToolbarHint",
      text: "Choose a row to dim other stages and see where that tool class tops out in the project benchmark.",
    });
    var group = el("div", { className: "comparisonDepthChips", role: "group", "aria-label": "Benchmark comparison" });

    FILTER_OPTIONS.forEach(function (opt) {
      var inputId = "comparison-filter-" + opt.id;
      var label = el("label", { className: "comparisonDepthChip", htmlFor: inputId });
      var input = el("input", {
        type: "radio",
        name: "comparison-depth-filter",
        id: inputId,
        value: opt.id,
        className: "comparisonDepthChipInput",
        title: opt.help,
        "aria-describedby": inputId + "-tip",
      });
      if (opt.id === "all") input.checked = true;
      label.appendChild(input);
      label.appendChild(el("span", { className: "comparisonDepthChipText", text: opt.label }));
      label.appendChild(el("span", { id: inputId + "-tip", className: "visually-hidden", text: opt.help }));
      group.appendChild(label);
    });

    fieldset.appendChild(group);
    root.appendChild(hint);
    root.appendChild(fieldset);

    return group;
  }

  function buildTimeline(root) {
    var list = el("ol", { className: "comparisonDepthTimeline" });
    var stepIndex = 0;

    FLOW.forEach(function (item) {
      if (item.type === "bridge") {
        list.appendChild(
          el("li", { className: "comparisonDepthBridgeWrap", "data-filter": item.filterId }, [
            el("div", {
              className: "comparisonDepthBridge",
              role: "note",
              text: item.text,
            }),
          ])
        );
        return;
      }

      stepIndex += 1;
      var li = el("li", {
        className:
          "comparisonDepthStepWrap" +
          (item.isFinal ? " comparisonDepthStepWrap--final" : ""),
        "data-filter": item.filterId,
        "data-step-key": item.key,
      });

      var card = el("article", {
        className: "comparisonDepthCard comparisonDepthCard--" + item.theme,
      });

      var head = el("div", { className: "comparisonDepthCardHead" }, [
        el("span", { className: "comparisonDepthStepNum", text: String(stepIndex) }),
        el("h3", { className: "comparisonDepthCardTitle", text: item.title }),
      ]);
      card.appendChild(head);
      card.appendChild(el("p", { className: "comparisonDepthCardDesc", text: item.desc }));

      if (item.filterLabel && !item.isFinal) {
        card.appendChild(
          el("p", { className: "comparisonDepthCardMeta", text: "Compare: " + item.filterLabel })
        );
      }

      li.appendChild(card);
      list.appendChild(li);
    });

    root.appendChild(list);
  }

  function applyFilter(root, filterId) {
    root.setAttribute("data-active-filter", filterId);
    var steps = root.querySelectorAll(".comparisonDepthStepWrap, .comparisonDepthBridgeWrap");
    steps.forEach(function (node) {
      var f = node.getAttribute("data-filter");
      if (filterId === "all") {
        node.classList.remove("isDimmed", "isFocused");
        return;
      }
      var focused = f === filterId;
      node.classList.toggle("isDimmed", !focused);
      node.classList.toggle("isFocused", focused);
    });
  }

  function wireFilters(root, chipGroup) {
    chipGroup.addEventListener("change", function (e) {
      var t = e.target;
      if (t && t.name === "comparison-depth-filter") applyFilter(root, t.value);
    });
  }

  function init() {
    var mount = document.getElementById("comparisonDepthMount");
    if (!mount) return;

    var root = el("div", {
      id: "comparisonDepthRoot",
      className: "comparisonDepth",
      role: "region",
      "aria-labelledby": "comparison-depth-caption",
      "data-active-filter": "all",
    });

    buildToolbar(root);
    buildTimeline(root);
    mount.appendChild(root);

    var chips = root.querySelector(".comparisonDepthChips");
    if (chips) wireFilters(root, chips);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
