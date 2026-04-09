/**
 * Mermaid-rendered diagrams with pan/zoom (@panzoom/panzoom).
 * Loads .mmd from /assets/diagrams/ or inline strings for hero/impact.
 */
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
import Panzoom from "https://esm.sh/@panzoom/panzoom@4.6.2";

const INLINE = {
  hero: `flowchart LR
    SRC[Source files] --> VS[VibeScan]
    VS --> OUT[Findings + reports]`,
  impact: `flowchart LR
    Ship[Ship] --> Scan[Scan in CI]
    Scan --> Fix[Fix with prompts]
    Fix -.->|iterate| Ship`,
};

function normalizeMmd(text) {
  let t = text.replace(/^\s*%%\{[\s\S]*?\}%%\s*/m, "");
  return t
    .split("\n")
    .filter(function (line) {
      return !/^\s*classDef\s/i.test(line) && !/^\s*class\s+/.test(line);
    })
    .join("\n")
    .trim();
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function bindPanzoom(shell, viewport, root, toolbar) {
  const reduced = prefersReducedMotion();
  const panzoom = Panzoom(root, {
    maxScale: 5,
    minScale: 0.15,
    canvas: true,
    animate: !reduced,
  });

  const pctEl = toolbar.querySelector(".diagramZoomPct");

  function syncPct() {
    if (pctEl) pctEl.textContent = `${Math.round(panzoom.getScale() * 100)}%`;
  }

  viewport.addEventListener(
    "wheel",
    function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      panzoom.zoomWithWheel(e);
    },
    { passive: false }
  );

  root.addEventListener("panzoomchange", syncPct);
  syncPct();

  toolbar.querySelector('[data-action="zoom-in"]')?.addEventListener("click", function () {
    panzoom.zoomIn();
  });
  toolbar.querySelector('[data-action="zoom-out"]')?.addEventListener("click", function () {
    panzoom.zoomOut();
  });
  toolbar.querySelector('[data-action="reset"]')?.addEventListener("click", function () {
    panzoom.reset();
    syncPct();
  });

  return { panzoom, syncPct };
}

function openFullscreen(shell) {
  if (shell._fullscreenOn) return;
  shell._fullscreenOn = true;
  document.body.style.overflow = "hidden";

  const close = document.createElement("button");
  close.type = "button";
  close.className = "diagramFullscreenClose";
  close.setAttribute("aria-label", "Close expanded diagram");
  close.textContent = "×";
  shell.appendChild(close);

  shell.classList.add("diagramShell--fullscreen");
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-modal", "true");
  shell.setAttribute("aria-label", "Expanded diagram");

  function cleanup() {
    shell._fullscreenOn = false;
    document.body.style.overflow = "";
    shell.classList.remove("diagramShell--fullscreen");
    shell.removeAttribute("role");
    shell.removeAttribute("aria-modal");
    shell.removeAttribute("aria-label");
    close.remove();
    document.removeEventListener("keydown", onKey);
    shell._fullscreenCleanup = null;
  }

  function onKey(e) {
    if (e.key === "Escape") cleanup();
  }

  close.addEventListener("click", cleanup);
  document.addEventListener("keydown", onKey);
  shell._fullscreenCleanup = cleanup;
  close.focus();
}

function wireExpand(shell, toolbar) {
  toolbar.querySelector('[data-action="expand"]')?.addEventListener("click", function () {
    openFullscreen(shell);
  });
}

async function renderDiagramShell(shell) {
  const src = shell.dataset.diagramSrc;
  const inlineKey = shell.dataset.inlineMermaid;
  const viewport = shell.querySelector(".diagramViewport");
  const root = shell.querySelector(".diagramPanzoomRoot");
  const mermaidEl = shell.querySelector(".mermaid");
  const loading = shell.querySelector(".diagramLoading");
  const toolbar = shell.querySelector(".diagramToolbar");

  if (!viewport || !root || !mermaidEl) return;

  const showToolbar = shell.dataset.zoom !== "false" && toolbar;

  let text;
  try {
    if (inlineKey && INLINE[inlineKey]) {
      text = INLINE[inlineKey];
    } else if (src) {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error(res.statusText);
      text = await res.text();
    } else {
      throw new Error("No diagram source");
    }
    if (!mermaidEl.id) {
      mermaidEl.id = shell.id ? `mermaid-${shell.id}` : `mermaid-${Math.random().toString(36).slice(2)}`;
    }
    mermaidEl.textContent = normalizeMmd(text);
    await mermaid.run({ nodes: [mermaidEl] });
  } catch (err) {
    shell.setAttribute("aria-busy", "false");
    if (loading) {
      loading.textContent = `Could not load diagram: ${String(err?.message || err)}`;
      loading.classList.add("diagramLoading--error");
    }
    return;
  }

  shell.setAttribute("aria-busy", "false");
  if (loading) loading.hidden = true;
  shell.classList.add("diagramShell--ready");

  if (toolbar) toolbar.hidden = !showToolbar;

  if (showToolbar && toolbar) {
    const pz = bindPanzoom(shell, viewport, root, toolbar);
    wireExpand(shell, toolbar);
    shell._panzoom = pz;
  }
}

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
  themeVariables: {
    primaryColor: "#1a2332",
    primaryTextColor: "#e7ecf3",
    primaryBorderColor: "#3d8bfd",
    lineColor: "#6b7a8f",
    secondaryColor: "#12121a",
    tertiaryColor: "#0a0a0f",
    fontSize: "13px",
  },
});

document.addEventListener("DOMContentLoaded", async function () {
  const shells = document.querySelectorAll(".diagramShell");
  for (const shell of shells) {
    await renderDiagramShell(shell);
  }
});
