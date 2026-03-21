const $ = (sel) => document.querySelector(sel);

const repoUrlEl = $("#repoUrl");
const scanBtn = $("#scanBtn");
const statusEl = $("#status");
const resultsEl = $("#results");
const blockedBigEl = $("#blockedBig");
const totalFindingsEl = $("#totalFindings");
const critErrCountEl = $("#critErrCount");
const findingsEl = $("#findings");

function setStatus(msg) {
  statusEl.textContent = msg;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function severityToBadge(sev) {
  return `<span class="badge">${escapeHtml(sev || "")}</span>`;
}

function renderFinding(f) {
  const badge = severityToBadge(f.severityLabel);
  const ruleId = escapeHtml(f.ruleId || "");
  const fileLine = escapeHtml(f.file || "(unknown)");
  const message = escapeHtml(f.message || "");
  return `
    <div class="finding">
      <div>${badge} <span style="color:#9898a8;font-size:12px;font-weight:800;">${ruleId}</span></div>
      <div class="fileLine">${fileLine}</div>
      <div class="findingMsg">${message}</div>
    </div>
  `;
}

function getSelectedScenario() {
  const checked = document.querySelector("input[name='scenario']:checked");
  return checked ? checked.value : "original";
}

async function startScan() {
  const repoUrl = repoUrlEl.value.trim();
  const scenario = getSelectedScenario();

  scanBtn.disabled = true;
  resultsEl.style.display = "none";
  findingsEl.innerHTML = "";
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

  const top = result.topFindings || [];
  findingsEl.innerHTML = top.length
    ? top.map(renderFinding).join("")
    : `<div style="color:#9898a8;font-size:13px;">No findings to display.</div>`;
}

scanBtn.addEventListener("click", () => {
  startScan();
});

