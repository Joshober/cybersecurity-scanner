// POST /api/scan with npm audit and poll until done (manual / CI smoke).
// Usage: node demo/scripts/smoke-scan-extra.mjs [baseUrl]
// Default baseUrl: http://127.0.0.1:3022

const base = process.argv[2] || "http://127.0.0.1:3022";

const body = {
  repoUrl: "https://github.com/feross/safe-buffer",
  scenario: "original",
  npmAudit: true,
  httpProbeUrl: "",
};

const res = await fetch(`${base}/api/scan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error("POST failed", res.status, await res.text());
  process.exit(1);
}

const { scanId } = await res.json();
console.log("scanId", scanId);

for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const r2 = await fetch(`${base}/api/scan/${encodeURIComponent(scanId)}`);
  const d = await r2.json();
  if (d.state === "error") {
    console.error("scan error", d.error);
    process.exit(1);
  }
  if (d.state === "done") {
    const { result } = d;
    console.log("OK state=done");
    console.log("scanFlags", result.scanFlags);
    console.log("totalFindings", result.totalFindings);
    const ids = new Set((result.topFindings || []).map((f) => f.ruleId));
    console.log("topFinding ruleIds sample", [...ids].slice(0, 8));
    if (!result.scanFlags?.npmAudit) {
      console.error("expected scanFlags.npmAudit true");
      process.exit(1);
    }
    process.exit(0);
  }
  if (i % 5 === 0) console.log("poll", i, d.state);
}

console.error("timeout");
process.exit(1);
