import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";

const DEMO_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(DEMO_DIR, "public");
const TMP_DIR = path.resolve(DEMO_DIR, ".tmp");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// In-memory job store (demo server is intended to be short-lived).
const jobs = new Map();
const leaderboard = {
  repoLabel: null,
  repoGitUrl: null,
  totalFindings: 0,
};

function repoLabelFromGitUrl(repoGitUrl) {
  try {
    const u = new URL(repoGitUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, "");
      return `${owner}/${repo}`;
    }
  } catch {
    // ignore
  }
  return repoGitUrl;
}

function sendText(res, status, body, contentType) {
  const buf = Buffer.from(body ?? "", "utf8");
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": buf.length,
    "Cache-Control": "no-store",
  });
  res.end(buf);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function safeGithubRepoUrl(input) {
  try {
    const u = new URL(input);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    if (!owner || !repo) return null;
    // Clone via git protocol over HTTPS.
    return `https://github.com/${owner}/${repo}.git`;
  } catch {
    return null;
  }
}

function gitClone(repoGitUrl, targetDir) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("git", ["clone", "--depth", "1", repoGitUrl, targetDir], {
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`git clone failed with exit code ${code}`));
    });
  });
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listScanFiles(repoDir) {
  const patterns = ["**/*.js", "**/*.ts", "**/*.mjs", "**/*.cjs"];
  const ignore = [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/public/**",
    "**/vibescan-generated-tests/**",
    "**/.tmp/**",
  ];

  const files = await fg(patterns, {
    cwd: repoDir,
    ignore,
    dot: false,
    absolute: true,
  });

  // Cap work for the demo.
  return files.slice(0, 500);
}

async function maybePatchSimulatedHack(repoDir) {
  // Write a deterministic vulnerable snippet so VibeScan blocks the change.
  // It is designed to trigger `injection.sql.string-concat` (string concatenation into SQL sink).
  const hackPath = path.join(repoDir, "vibescan-demo-hack.js");
  const hackSource = `// Added by VibeScan demo: intentionally vulnerable SQL injection.
export async function demo(req, _res) {
  const db = {
    // Sink that VibeScan treats as a SQL execution method
    query: (q) => q,
  };

  // Tainted input from Express request reaches a string-concatenated SQL call.
  const id = req?.query?.id;
  return db.query("SELECT * FROM users WHERE id = " + id);
}
`;
  await fs.writeFile(hackPath, hackSource, "utf8");
}

function severityWeight(sev) {
  const s = String(sev || "").toLowerCase();
  if (s === "critical") return 4;
  if (s === "error") return 3;
  if (s === "warning") return 2;
  if (s === "info") return 1;
  return 0;
}

function escCell(s) {
  return String(s ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function buildAiPromptMarkdown({ projectRoot, findings, scannedRelativePaths }) {
  const rows = (findings || []).map((f) => {
    const loc = f.filePath != null ? `${f.filePath}:${f.line}` : `:${f.line}`;
    return `| ${escCell(f.ruleId)} | ${escCell(f.severity)} | ${escCell(loc)} | ${escCell(f.message)} |`;
  });

  const table =
    rows.length > 0
      ? ["| ruleId | severity | location | message |", "| --- | --- | --- | --- |", ...rows].join("\n")
      : "_No findings at the current severity threshold._";

  const files = [...new Set(scannedRelativePaths || [])].sort();
  const filesBlock = files.length ? files.map((p) => `- \`${p}\``).join("\n") : "_No files listed._";

  const json = JSON.stringify(
    (findings || []).map((f) => ({
      ruleId: f.ruleId,
      severity: f.severity,
      message: f.message,
      filePath: f.filePath,
      line: f.line,
      column: f.column,
      remediation: f.remediation ?? f.fix,
    })),
    null,
    2
  );

  return `# VibeScan — IDE-assisted security review

VibeScan does not call a remote LLM API or ask for API keys. This file is a paste-in prompt for tools that already run in your repo (Cursor, Claude Code, etc).

## Paste into your assistant

Use the static findings below. For each row: open the location, confirm the issue, rate false-positive risk, and propose a concrete fix (code-level). Prefer minimal, testable changes.

### Summary table

${table}

### Files included in this scan

${filesBlock}

---

## Machine-readable findings (JSON)

\`\`\`json
${json}
\`\`\`

---
Project root (scanner): \`${projectRoot}\`
`;
}

async function runScanJob(scanId, repoGitUrl, scenario) {
  const job = jobs.get(scanId);
  if (!job) return;

  job.state = "running";

  try {
    await ensureDir(TMP_DIR);

    const workDir = path.join(TMP_DIR, scanId);
    const repoDir = path.join(workDir, "repo");
    await fs.rm(workDir, { recursive: true, force: true });
    await ensureDir(repoDir);

    // git clone expects the destination dir to not exist or be empty; we provide a fresh empty dir.
    // Remove then recreate to avoid edge cases.
    await fs.rm(repoDir, { recursive: true, force: true });
    await ensureDir(workDir);

    await gitClone(repoGitUrl, repoDir);

    if (scenario === "simulated_hacked") {
      await maybePatchSimulatedHack(repoDir);
    }

    // Use the published npm package (Render deploys can install @latest).
    const scanner = await import("@jobersteadt/vibescan");
    const scanProjectAsync = scanner.scanProjectAsync;
    const projectScanToHtmlReport = scanner.projectScanToHtmlReport;

    const files = await listScanFiles(repoDir);
    const entries = [];
    let bytes = 0;
    for (const filePath of files) {
      if (entries.length >= 300) break;
      const source = await fs.readFile(filePath, "utf8");
      bytes += Buffer.byteLength(source);
      if (bytes > 4 * 1024 * 1024) break;
      entries.push({ path: filePath, source });
    }

    const options = { crypto: true, injection: true, severityThreshold: "info" };
    const projectRoot = repoDir;
    const project = await scanProjectAsync(entries, options, projectRoot);
    const findings = project.findings || [];

    const criticalOrError = findings.filter(
      (f) => f.severity === "critical" || f.severity === "error"
    );
    const blocked = criticalOrError.length > 0;

    const countsBySeverity = findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {});

    const topFindings = [...findings]
      .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
      .slice(0, 10)
      .map((f) => {
        const abs = f.filePath || "";
        const rel = abs && abs.startsWith(repoDir) ? path.relative(repoDir, abs) : abs || "(unknown)";
        return {
          ruleId: f.ruleId,
          severityLabel: f.severityLabel,
          message: f.message,
          file: `${rel}:${f.line}`,
        };
      });

    const scannedRelativePaths = files
      .map((abs) => (abs && abs.startsWith(repoDir) ? path.relative(repoDir, abs) : abs))
      .filter(Boolean);

    // Pre-render the report HTML so the UI can match VibeScan's real report.
    // NOTE: we only embed metadata safe for display in a local demo.
    const reportHtml = typeof projectScanToHtmlReport === "function"
      ? projectScanToHtmlReport(project, {
          generatedAt: new Date().toISOString(),
          projectLabel: repoGitUrl,
        })
      : null;

    const promptMarkdown = buildAiPromptMarkdown({
      projectRoot,
      findings,
      scannedRelativePaths,
    });

    job.result = {
      repoGitUrl,
      scenario,
      blocked,
      totalFindings: findings.length,
      criticalOrErrorCount: criticalOrError.length,
      countsBySeverity,
      topFindings,
      // For UI deep-links.
      reportPath: `/api/scan/${scanId}/report.html`,
      promptPath: `/api/scan/${scanId}/prompt.md`,
    };

    // Update leaderboard (max total findings in this server session).
    if (Number.isFinite(findings.length) && findings.length > (leaderboard.totalFindings ?? 0)) {
      leaderboard.totalFindings = findings.length;
      leaderboard.repoGitUrl = repoGitUrl;
      leaderboard.repoLabel = repoLabelFromGitUrl(repoGitUrl);
    }
    job.artifacts = {
      repoDir,
      reportHtml,
      promptMarkdown,
    };
    job.state = "done";
  } catch (err) {
    job.error = String(err?.message || err);
    job.state = "error";
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(res, urlPath) {
  const relRequested = urlPath.replace(/^\/+/, "");
  const localPath = path.join(PUBLIC_DIR, relRequested);

  if (!localPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(localPath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const data = await fs.readFile(localPath);
  res.writeHead(200, {
    "Content-Type": contentTypeFor(localPath),
    "Content-Length": data.length,
    "Cache-Control": "no-store",
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  // Wrap in async IIFE so we can use await without changing Node's callback signature.
  (async () => {
    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = u.pathname;

    if (req.method === "GET" && (pathname === "/" || pathname === "")) {
      await serveStatic(res, "/index.html");
      return;
    }

    if (pathname.startsWith("/api/")) {
      if (req.method === "GET" && pathname === "/api/leaderboard") {
        sendJson(res, 200, {
          top: leaderboard.repoGitUrl
            ? {
                repoLabel: leaderboard.repoLabel,
                repoGitUrl: leaderboard.repoGitUrl,
                totalFindings: leaderboard.totalFindings,
              }
            : null,
        });
        return;
      }
      if (req.method === "POST" && pathname === "/api/scan") {
        const body = await readJsonBody(req);
        const repoInput = String(body.repoUrl || "");
        const scenarioInput = String(body.scenario || "original");

        const repoGitUrl = safeGithubRepoUrl(repoInput);
        if (!repoGitUrl) {
          sendJson(res, 400, { error: "repoUrl must be a https://github.com/<owner>/<repo> URL" });
          return;
        }

        const scenario = scenarioInput === "simulated_hacked" ? "simulated_hacked" : "original";

        const scanId = randomUUID();
        jobs.set(scanId, { state: "queued", result: null, error: null });

        // Fire-and-forget background job.
        runScanJob(scanId, repoGitUrl, scenario).catch(() => {});

        sendJson(res, 202, { scanId });
        return;
      }

      if (req.method === "GET" && pathname.startsWith("/api/scan/")) {
        const parts = pathname.split("/").filter(Boolean);
        const scanId = parts[2];
        const tail = parts[3];
        const job = jobs.get(scanId);
        if (!job) {
          sendJson(res, 404, { error: "Unknown scanId" });
          return;
        }

        if (req.method === "GET" && tail === "report.html") {
          if (job.state !== "done") {
            sendJson(res, 409, { error: `Scan not ready (state: ${job.state})` });
            return;
          }
          const html = job.artifacts?.reportHtml;
          if (!html) {
            sendJson(res, 500, { error: "Report renderer not available (missing build output)" });
            return;
          }
          sendText(res, 200, html, "text/html; charset=utf-8");
          return;
        }

        if (req.method === "GET" && tail === "prompt.md") {
          if (job.state !== "done") {
            sendJson(res, 409, { error: `Scan not ready (state: ${job.state})` });
            return;
          }
          const md = job.artifacts?.promptMarkdown;
          if (!md) {
            sendJson(res, 500, { error: "Prompt generator not available (missing build output)" });
            return;
          }
          sendText(res, 200, md, "text/markdown; charset=utf-8");
          return;
        }

        if (job.state === "done") {
          sendJson(res, 200, { state: job.state, result: job.result });
          return;
        }
        if (job.state === "error") {
          sendJson(res, 200, { state: job.state, error: job.error });
          return;
        }

        sendJson(res, 200, { state: job.state });
        return;
      }

      sendJson(res, 404, { error: "Not found" });
      return;
    }

    if (req.method === "GET") {
      await serveStatic(res, pathname);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  })().catch((err) => {
    sendJson(res, 500, { error: String(err?.message || err) });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`VibeScan demo listening on http://localhost:${PORT}`);
});

