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
const reportFrameEl = $("#reportFrame");
const promptBoxEl = $("#promptBox");
const copyPromptEl = $("#copyPrompt");
const promptStatusEl = $("#promptStatus");
const leaderRepoEl = $("#leaderRepo");
const leaderCountEl = $("#leaderCount");

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

async function refreshLeaderboard() {
  try {
    const data = await fetchJson("/api/leaderboard");
    setLeaderboard(data.top);
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
}

scanBtn.addEventListener("click", () => {
  startScan();
});

refreshLeaderboard();

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

