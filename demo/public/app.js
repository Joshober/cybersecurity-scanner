const $ = (sel) => document.querySelector(sel);

const repoUrlEl = $("#repoUrl");
const scanBtn = $("#scanBtn");
const statusEl = $("#status");
const resultsEl = $("#results");
const blockedBigEl = $("#blockedBig");
const totalFindingsEl = $("#totalFindings");
const critErrCountEl = $("#critErrCount");
const openReportEl = $("#openReport");
const openPromptEl = $("#openPrompt");
const openProjectJsonEl = $("#openProjectJson");
const openSarifEl = $("#openSarif");
const copyShareLinkEl = $("#copyShareLink");
const reportFrameEl = $("#reportFrame");
const promptBoxEl = $("#promptBox");
const copyPromptEl = $("#copyPrompt");
const promptStatusEl = $("#promptStatus");
const leaderRepoEl = $("#leaderRepo");
const leaderCountEl = $("#leaderCount");
const leaderTop5El = $("#leaderTop5");
const compareBarEl = $("#compareBar");
const viewOriginalEl = $("#viewOriginal");
const viewHackedEl = $("#viewHacked");
const compareSummaryEl = $("#compareSummary");

function normalizeRepoUrl(s) {
  return String(s || "")
    .trim()
    .replace(/\/+$/, "");
}

function syncPresetButtons() {
  const presetBtns = document.querySelectorAll(".presetRepoBtn");
  if (!presetBtns.length || !repoUrlEl) return;
  const v = normalizeRepoUrl(repoUrlEl.value);
  for (const btn of presetBtns) {
    const u = normalizeRepoUrl(btn.getAttribute("data-repo-url"));
    btn.classList.toggle("segBtnActive", u !== "" && v === u);
  }
}

function initPresetRepoButtons() {
  const presetBtns = document.querySelectorAll(".presetRepoBtn");
  if (!presetBtns.length || !repoUrlEl) return;
  for (const btn of presetBtns) {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-repo-url");
      if (url) repoUrlEl.value = url;
      syncPresetButtons();
      repoUrlEl.focus();
    });
  }
  repoUrlEl.addEventListener("input", () => syncPresetButtons());
  syncPresetButtons();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function getSelectedScenario() {
  const checked = document.querySelector("input[name='scenario']:checked");
  return checked ? checked.value : "original";
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`.trim());
  return await r.text();
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => "")}`.trim());
  return await r.json();
}

function setPromptStatus(msg) {
  promptStatusEl.textContent = msg;
}

function setShareLinkVisible(isVisible) {
  if (!copyShareLinkEl) return;
  copyShareLinkEl.style.display = isVisible ? "inline-flex" : "none";
}

function setCompareUiVisible(isVisible) {
  if (!compareBarEl) return;
  compareBarEl.style.display = isVisible ? "flex" : "none";
}

function setActiveSeg(active) {
  if (!viewOriginalEl || !viewHackedEl) return;
  viewOriginalEl.classList.toggle("segBtnActive", active === "original");
  viewHackedEl.classList.toggle("segBtnActive", active === "hacked");
}

function setLeaderboard(top) {
  if (!leaderRepoEl || !leaderCountEl) return;
  if (!top) {
    leaderRepoEl.textContent = "—";
    leaderCountEl.textContent = "—";
    return;
  }
  leaderRepoEl.textContent = top.repoLabel || top.repoGitUrl || "—";
  leaderCountEl.textContent = String(top.totalFindings ?? "—");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setTop5(list) {
  if (!leaderTop5El) return;
  const rows = Array.isArray(list) ? list : [];
  if (!rows.length) {
    leaderTop5El.style.display = "none";
    leaderTop5El.innerHTML = "";
    return;
  }
  leaderTop5El.style.display = "grid";
  leaderTop5El.innerHTML = rows
    .map((r, i) => {
      const label = escapeHtml(r.repoLabel || r.repoGitUrl || "—");
      const n = escapeHtml(String(r.totalFindings ?? "—"));
      return `<div class="leaderRowItem"><div><span class="leaderRowRank">${i + 1}.</span> <code>${label}</code></div><div class="leaderRowFindings">${n}</div></div>`;
    })
    .join("");
}

async function refreshLeaderboard() {
  try {
    const data = await fetchJson("/api/leaderboard");
    setLeaderboard(data.top);
    setTop5(data.all);
    try {
      localStorage.setItem("vibescan-demo-leaderboard", JSON.stringify({ top: data.top, all: data.all }));
    } catch {
      // ignore
    }
  } catch {
    // Non-fatal; keep placeholders.
  }
}

async function startScan() {
  const repoUrl = repoUrlEl.value.trim();
  const scenario = getSelectedScenario();

  scanBtn.disabled = true;
  resultsEl.style.display = "none";
  reportFrameEl.removeAttribute("src");
  promptBoxEl.value = "";
  copyPromptEl.disabled = true;
  setPromptStatus("—");
  openReportEl.style.display = "none";
  openPromptEl.style.display = "none";
  openProjectJsonEl.style.display = "none";
  openSarifEl.style.display = "none";
  setShareLinkVisible(false);
  setStatus("Queued scan…");

  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl, scenario }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    scanBtn.disabled = false;
    setStatus(`Scan request failed: ${res.status} ${t}`);
    return;
  }

  const data = await res.json();
  const scanId = data.scanId;

  setStatus(`Running scan (id: ${scanId})…`);
  pollScan(scanId);
}

async function pollScan(scanId) {
  let tries = 0;
  const maxTries = 240; // ~6-8 minutes at 2s interval

  const interval = setInterval(async () => {
    tries++;
    if (tries > maxTries) {
      clearInterval(interval);
      scanBtn.disabled = false;
      setStatus("Timed out waiting for scan results.");
      return;
    }

    const r = await fetch(`/api/scan/${encodeURIComponent(scanId)}`).catch((e) => {
      setStatus(`Network error while polling: ${String(e)}`);
      return null;
    });
    if (!r) return;
    if (!r.ok) {
      setStatus(`Polling failed: ${r.status}`);
      return;
    }

    const data = await r.json();
    if (data.state === "running") setStatus(`Cloning + scanning… (id: ${scanId})`);
    if (data.state === "queued") setStatus(`Queued…`);

    if (data.state === "done") {
      clearInterval(interval);
      scanBtn.disabled = false;
      setStatus("Scan complete.");
      showResults(data.result);
      refreshLeaderboard();
      return;
    }

    if (data.state === "error") {
      clearInterval(interval);
      scanBtn.disabled = false;
      setStatus(`Scan error: ${data.error || "unknown"}`);
      return;
    }
  }, 2000);
}

function showResults(result) {
  resultsEl.style.display = "block";

  // Compare support (defaults to hacked if present).
  if (result.compare && result.compare.original && result.compare.hacked) {
    setCompareUiVisible(true);
    setActiveSeg("hacked");
    if (compareSummaryEl) {
      const o = result.compare.original;
      const h = result.compare.hacked;
      compareSummaryEl.textContent = `Original: ${o.totalFindings} · Hacked: ${h.totalFindings} (Δ ${h.totalFindings - o.totalFindings})`;
    }

    const setView = (which) => {
      const block = which === "original" ? result.compare.original : result.compare.hacked;
      setActiveSeg(which);
      if (block.reportPath) {
        openReportEl.href = block.reportPath;
        openReportEl.style.display = "inline-flex";
        reportFrameEl.src = block.reportPath;
      }
      if (block.promptPath) {
        openPromptEl.href = block.promptPath;
        openPromptEl.style.display = "inline-flex";
        setPromptStatus("Loading…");
        fetchText(block.promptPath)
          .then((md) => {
            promptBoxEl.value = md;
            copyPromptEl.disabled = md.trim().length === 0;
            setPromptStatus(md.trim().length ? "Ready" : "Empty prompt");
          })
          .catch((e) => {
            promptBoxEl.value = "";
            copyPromptEl.disabled = true;
            setPromptStatus(`Failed to load prompt: ${String(e?.message || e)}`);
          });
      }
    };

    viewOriginalEl?.addEventListener("click", () => setView("original"), { once: true });
    viewHackedEl?.addEventListener("click", () => setView("hacked"), { once: true });

    // Keep metrics showing "hacked" by default.
  } else {
    setCompareUiVisible(false);
  }

  const blocked = !!result.blocked;
  blockedBigEl.textContent = blocked ? "BLOCKED" : "NOT BLOCKED";
  blockedBigEl.classList.toggle("blocked", blocked);
  blockedBigEl.classList.toggle("not-blocked", !blocked);

  totalFindingsEl.textContent = String(result.totalFindings ?? "—");
  critErrCountEl.textContent = String(result.criticalOrErrorCount ?? "—");

  if (result.reportPath) {
    openReportEl.href = result.reportPath;
    openReportEl.style.display = "inline-flex";
    reportFrameEl.src = result.reportPath;
  }

  if (result.promptPath) {
    openPromptEl.href = result.promptPath;
    openPromptEl.style.display = "inline-flex";
    setPromptStatus("Loading…");
    fetchText(result.promptPath)
      .then((md) => {
        promptBoxEl.value = md;
        copyPromptEl.disabled = md.trim().length === 0;
        setPromptStatus(md.trim().length ? "Ready" : "Empty prompt");
      })
      .catch((e) => {
        promptBoxEl.value = "";
        copyPromptEl.disabled = true;
        setPromptStatus(`Failed to load prompt: ${String(e?.message || e)}`);
      });
  }

  if (result.projectJsonPath) {
    openProjectJsonEl.href = result.projectJsonPath;
    openProjectJsonEl.style.display = "inline-flex";
  }

  if (result.sarifPath) {
    openSarifEl.href = result.sarifPath;
    openSarifEl.style.display = "inline-flex";
  }

  // Share link points to /scan/<scanId>.
  if (result.reportPath && typeof result.reportPath === "string") {
    const m = result.reportPath.match(/\/api\/scan\/([^/]+)\/report\.html/);
    if (m && m[1] && copyShareLinkEl) {
      const scanId = m[1];
      const url = new URL(window.location.href);
      url.pathname = `/scan/${encodeURIComponent(scanId)}`;
      url.search = "";
      copyShareLinkEl.dataset.shareUrl = url.toString();
      setShareLinkVisible(true);
    }
  }
}

scanBtn.addEventListener("click", () => {
  startScan();
});

initPresetRepoButtons();
refreshLeaderboard();

// Fast initial paint: load cached leaderboard while network request runs.
try {
  const cached = JSON.parse(localStorage.getItem("vibescan-demo-leaderboard") || "null");
  if (cached) {
    setLeaderboard(cached.top);
    setTop5(cached.all);
  }
} catch {
  // ignore
}

copyShareLinkEl?.addEventListener("click", async () => {
  const url = copyShareLinkEl.dataset.shareUrl || "";
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Share link copied.");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    setStatus("Share link copied (fallback).");
  }
});

async function loadScanFromPath() {
  const m = window.location.pathname.match(/^\/scan\/([^/]+)$/);
  if (!m) return;
  const scanId = decodeURIComponent(m[1]);
  setStatus(`Loading scan ${scanId}…`);
  resultsEl.style.display = "none";
  pollScan(scanId);
}

loadScanFromPath();

copyPromptEl.addEventListener("click", async () => {
  const text = promptBoxEl.value || "";
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    setPromptStatus("Copied to clipboard");
  } catch {
    // Fallback for older browsers / clipboard permissions.
    promptBoxEl.focus();
    promptBoxEl.select();
    document.execCommand("copy");
    setPromptStatus("Copied (fallback)");
  }
});

