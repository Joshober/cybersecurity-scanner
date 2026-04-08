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
const RUNS_DIR = path.resolve(TMP_DIR, "runs");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// In-memory job store (demo server is intended to be short-lived).
const jobs = new Map();
const leaderboard = {
  rowsByRepo: new Map(), // repoGitUrl -> { repoLabel, repoGitUrl, totalFindings }
};

const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT ?? 2);
const CLONE_TIMEOUT_MS = Number(process.env.CLONE_TIMEOUT_MS ?? 60_000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 60 * 1000); // 1h
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 10);
const ipCounters = new Map(); // ip -> { windowStartMs, count }

const CLONE_CACHE_DIR = path.resolve(TMP_DIR, "clone-cache");
const cloneCache = new Map(); // repoGitUrl -> { dir, createdAtMs }

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

function sendBytes(res, status, buf, contentType, extraHeaders) {
  const body = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf ?? ""), "utf8");
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    ...(extraHeaders ?? {}),
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

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  if (Array.isArray(xf) && xf.length) return String(xf[0]).trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimitOk(ip) {
  const now = Date.now();
  const cur = ipCounters.get(ip);
  if (!cur || now - cur.windowStartMs > RATE_LIMIT_WINDOW_MS) {
    ipCounters.set(ip, { windowStartMs: now, count: 1 });
    return true;
  }
  if (cur.count >= RATE_LIMIT_MAX) return false;
  cur.count += 1;
  return true;
}

function gitClone(repoGitUrl, targetDir) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("git", ["clone", "--depth", "1", repoGitUrl, targetDir], {
      stdio: "ignore",
      windowsHide: true,
    });
    const t = setTimeout(() => {
      child.kill();
      rejectPromise(new Error(`git clone timed out after ${CLONE_TIMEOUT_MS}ms`));
    }, CLONE_TIMEOUT_MS);
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      clearTimeout(t);
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`git clone failed with exit code ${code}`));
    });
  });
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyDir(fromDir, toDir) {
  await fs.cp(fromDir, toDir, { recursive: true, force: true, errorOnExist: false });
}

async function ensureClonedRepo(repoGitUrl) {
  await ensureDir(CLONE_CACHE_DIR);
  const cached = cloneCache.get(repoGitUrl);
  if (cached && existsSync(cached.dir)) return cached.dir;

  const cacheId = safeFileName(`${repoLabelFromGitUrl(repoGitUrl)}-${Date.now()}`);
  const dir = path.join(CLONE_CACHE_DIR, cacheId);
  await fs.rm(dir, { recursive: true, force: true });
  await gitClone(repoGitUrl, dir);
  cloneCache.set(repoGitUrl, { dir, createdAtMs: Date.now() });
  return dir;
}

function safeFileName(s) {
  return String(s ?? "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 120);
}

async function persistRunArtifacts(scanId, artifacts) {
  const outDir = path.join(RUNS_DIR, scanId);
  await ensureDir(outDir);
  const reportPath = path.join(outDir, "report.html");
  const promptPath = path.join(outDir, "prompt.md");
  const jsonPath = path.join(outDir, "project.json");
  const sarifPath = path.join(outDir, "report.sarif");
  const metaPath = path.join(outDir, "meta.json");

  if (artifacts?.reportHtml) await fs.writeFile(reportPath, artifacts.reportHtml, "utf8");
  if (artifacts?.promptMarkdown) await fs.writeFile(promptPath, artifacts.promptMarkdown, "utf8");
  if (artifacts?.projectJsonText) await fs.writeFile(jsonPath, artifacts.projectJsonText, "utf8");
  if (artifacts?.sarifText) await fs.writeFile(sarifPath, artifacts.sarifText, "utf8");
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        scanId,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
}

async function readPersistedRunFile(scanId, fileName) {
  const base = path.join(RUNS_DIR, scanId);
  const target = path.join(base, fileName);
  if (!target.startsWith(base)) return null;
  if (!existsSync(target)) return null;
  return await fs.readFile(target);
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

    // Clone caching: clone once per repo and copy into job workspace.
    const cachedRepoDir = await ensureClonedRepo(repoGitUrl);
    await copyDir(cachedRepoDir, repoDir);

    if (scenario === "simulated_hacked") {
      await maybePatchSimulatedHack(repoDir);
    }

    // Use the published npm package (Render deploys can install @latest).
    const scanner = await import("@jobersteadt/vibescan");
    const scanProjectAsync = scanner.scanProjectAsync;
    const projectScanToHtmlReport = scanner.projectScanToHtmlReport;
    const formatProjectJson = scanner.formatProjectJson;
    const formatProjectSarif = scanner.formatProjectSarif;

    const files = await listScanFiles(repoDir);
    const scannedRelativePaths = files
      .map((abs) => (abs && abs.startsWith(repoDir) ? path.relative(repoDir, abs) : abs))
      .filter(Boolean);
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

    async function scanOnce(label) {
      const project = await scanProjectAsync(entries, options, projectRoot);
      const findings = project.findings || [];
      const criticalOrError = findings.filter((f) => f.severity === "critical" || f.severity === "error");
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

      const reportHtml = typeof projectScanToHtmlReport === "function"
        ? projectScanToHtmlReport(project, {
            generatedAt: new Date().toISOString(),
            projectLabel: `${repoGitUrl}${label ? ` (${label})` : ""}`,
          })
        : null;

      const promptMarkdown = buildAiPromptMarkdown({
        projectRoot,
        findings,
        scannedRelativePaths,
      });

      const projectJsonText =
        typeof formatProjectJson === "function"
          ? formatProjectJson(project, { benchmarkMetadata: true, includeRuleFamily: true })
          : JSON.stringify(project, null, 2);

      const sarifText =
        typeof formatProjectSarif === "function"
          ? formatProjectSarif(project)
          : JSON.stringify({ error: "SARIF formatter not available" }, null, 2);

      return {
        project,
        findings,
        blocked,
        totalFindings: findings.length,
        criticalOrErrorCount: criticalOrError.length,
        countsBySeverity,
        topFindings,
        artifacts: { reportHtml, promptMarkdown, projectJsonText, sarifText },
      };
    }

    let scanOut;
    if (scenario === "compare") {
      // Original scan
      const orig = await scanOnce("original");
      // Apply hack and scan again
      await maybePatchSimulatedHack(repoDir);
      const hacked = await scanOnce("hacked");
      scanOut = { orig, hacked };
    } else {
      if (scenario === "simulated_hacked") await maybePatchSimulatedHack(repoDir);
      const single = await scanOnce(scenario);
      scanOut = { single };
    }

    if (scenario === "compare") {
      job.result = {
        repoGitUrl,
        scenario,
        blocked: scanOut.hacked.blocked,
        totalFindings: scanOut.hacked.totalFindings,
        criticalOrErrorCount: scanOut.hacked.criticalOrErrorCount,
        countsBySeverity: scanOut.hacked.countsBySeverity,
        topFindings: scanOut.hacked.topFindings,
        compare: {
          original: {
            blocked: scanOut.orig.blocked,
            totalFindings: scanOut.orig.totalFindings,
            criticalOrErrorCount: scanOut.orig.criticalOrErrorCount,
            reportPath: `/api/scan/${scanId}/original/report.html`,
            promptPath: `/api/scan/${scanId}/original/prompt.md`,
          },
          hacked: {
            blocked: scanOut.hacked.blocked,
            totalFindings: scanOut.hacked.totalFindings,
            criticalOrErrorCount: scanOut.hacked.criticalOrErrorCount,
            reportPath: `/api/scan/${scanId}/hacked/report.html`,
            promptPath: `/api/scan/${scanId}/hacked/prompt.md`,
          },
        },
        // Defaults to hacked view.
        reportPath: `/api/scan/${scanId}/hacked/report.html`,
        promptPath: `/api/scan/${scanId}/hacked/prompt.md`,
        projectJsonPath: `/api/scan/${scanId}/hacked/project.json`,
        sarifPath: `/api/scan/${scanId}/hacked/report.sarif`,
      };
      job.artifacts = {
        repoDir,
        compare: {
          original: scanOut.orig.artifacts,
          hacked: scanOut.hacked.artifacts,
        },
      };
    } else {
      job.result = {
        repoGitUrl,
        scenario,
        blocked: scanOut.single.blocked,
        totalFindings: scanOut.single.totalFindings,
        criticalOrErrorCount: scanOut.single.criticalOrErrorCount,
        countsBySeverity: scanOut.single.countsBySeverity,
        topFindings: scanOut.single.topFindings,
        // For UI deep-links.
        reportPath: `/api/scan/${scanId}/report.html`,
        promptPath: `/api/scan/${scanId}/prompt.md`,
        projectJsonPath: `/api/scan/${scanId}/project.json`,
        sarifPath: `/api/scan/${scanId}/report.sarif`,
      };
      job.artifacts = {
        repoDir,
        reportHtml: scanOut.single.artifacts.reportHtml,
        promptMarkdown: scanOut.single.artifacts.promptMarkdown,
        projectJsonText: scanOut.single.artifacts.projectJsonText,
        sarifText: scanOut.single.artifacts.sarifText,
      };
    }

    // Update leaderboard (keep ALL repos; show sorted client-side).
    const nForLeader = scenario === "compare" ? scanOut.hacked.totalFindings : scanOut.single.totalFindings;
    if (Number.isFinite(nForLeader)) {
      const repoLabel = repoLabelFromGitUrl(repoGitUrl);
      const prev = leaderboard.rowsByRepo.get(repoGitUrl);
      const next = {
        repoLabel,
        repoGitUrl,
        totalFindings: Math.max(prev?.totalFindings ?? 0, nForLeader),
      };
      leaderboard.rowsByRepo.set(repoGitUrl, next);
    }
    // Persist artifacts (single or compare).
    if (scenario === "compare") {
      await ensureDir(RUNS_DIR);
      await ensureDir(path.join(RUNS_DIR, scanId, "original"));
      await ensureDir(path.join(RUNS_DIR, scanId, "hacked"));
      await persistRunArtifacts(`${scanId}/original`, scanOut.orig.artifacts);
      await persistRunArtifacts(`${scanId}/hacked`, scanOut.hacked.artifacts);
    } else {
      await persistRunArtifacts(scanId, job.artifacts);
    }
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

    if (req.method === "GET" && pathname.startsWith("/scan/")) {
      // Permalink view (client reads scanId from URL).
      await serveStatic(res, "/index.html");
      return;
    }

    if (pathname.startsWith("/api/")) {
      if (req.method === "GET" && pathname === "/api/leaderboard") {
        const all = [...leaderboard.rowsByRepo.values()].sort(
          (a, b) => (b.totalFindings ?? 0) - (a.totalFindings ?? 0)
        );
        sendJson(res, 200, {
          top: all[0] ?? null,
          all,
        });
        return;
      }
      if (req.method === "POST" && pathname === "/api/scan") {
        // Concurrency + rate limiting for public hosting.
        const running = [...jobs.values()].filter((j) => j.state === "running" || j.state === "queued").length;
        if (running >= MAX_CONCURRENT) {
          sendJson(res, 429, { error: `Too many concurrent scans (max ${MAX_CONCURRENT}). Try again shortly.` });
          return;
        }
        const ip = getClientIp(req);
        if (!rateLimitOk(ip)) {
          sendJson(res, 429, { error: `Rate limit exceeded (${RATE_LIMIT_MAX} per ${Math.round(RATE_LIMIT_WINDOW_MS / 60000)} minutes).` });
          return;
        }

        const body = await readJsonBody(req);
        const repoInput = String(body.repoUrl || "");
        const scenarioInput = String(body.scenario || "original");

        const repoGitUrl = safeGithubRepoUrl(repoInput);
        if (!repoGitUrl) {
          sendJson(res, 400, { error: "repoUrl must be a https://github.com/<owner>/<repo> URL" });
          return;
        }

        const scenario =
          scenarioInput === "simulated_hacked"
            ? "simulated_hacked"
            : scenarioInput === "compare"
              ? "compare"
              : "original";

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
        const tail2 = parts[4];
        const job = jobs.get(scanId);
        // Compare artifact routes: /api/scan/:id/(original|hacked)/<file>
        const compareFlavor = tail === "original" || tail === "hacked" ? tail : null;
        const compareFile = compareFlavor ? tail2 : null;

        // If job isn't in memory (server restarted), allow serving persisted artifacts.
        if (!job && (compareFile || tail) && ["report.html", "prompt.md", "project.json", "report.sarif"].includes(compareFile || tail)) {
          const fileMap = {
            "report.html": "report.html",
            "prompt.md": "prompt.md",
            "project.json": "project.json",
            "report.sarif": "report.sarif",
          };
          const effectiveScanId = compareFlavor ? `${scanId}/${compareFlavor}` : scanId;
          const effectiveTail = compareFile || tail;
          const buf = await readPersistedRunFile(effectiveScanId, fileMap[effectiveTail]);
          if (!buf) {
            sendJson(res, 404, { error: "Unknown scanId" });
            return;
          }
          const ct =
            effectiveTail === "report.html"
              ? "text/html; charset=utf-8"
              : effectiveTail === "prompt.md"
                ? "text/markdown; charset=utf-8"
                : effectiveTail === "project.json"
                  ? "application/json; charset=utf-8"
                  : "application/sarif+json; charset=utf-8";
          const disp =
            effectiveTail === "project.json"
              ? { "Content-Disposition": `attachment; filename="vibescan-${safeFileName(scanId)}.json"` }
              : effectiveTail === "report.sarif"
                ? { "Content-Disposition": `attachment; filename="vibescan-${safeFileName(scanId)}.sarif"` }
                : undefined;
          sendBytes(res, 200, buf, ct, disp);
          return;
        }

        if (!job) {
          sendJson(res, 404, { error: "Unknown scanId" });
          return;
        }

        // Compare artifacts when job is in memory.
        if (compareFlavor && compareFile) {
          if (job.state !== "done") {
            sendJson(res, 409, { error: `Scan not ready (state: ${job.state})` });
            return;
          }
          const art = job.artifacts?.compare?.[compareFlavor];
          if (!art) {
            sendJson(res, 404, { error: "Compare artifacts not found" });
            return;
          }
          if (compareFile === "report.html") return sendText(res, 200, art.reportHtml || "", "text/html; charset=utf-8");
          if (compareFile === "prompt.md") return sendText(res, 200, art.promptMarkdown || "", "text/markdown; charset=utf-8");
          if (compareFile === "project.json") return sendBytes(res, 200, art.projectJsonText || "{}", "application/json; charset=utf-8");
          if (compareFile === "report.sarif") return sendBytes(res, 200, art.sarifText || "{}", "application/sarif+json; charset=utf-8");
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

        if (req.method === "GET" && tail === "project.json") {
          if (job.state !== "done") {
            sendJson(res, 409, { error: `Scan not ready (state: ${job.state})` });
            return;
          }
          const jsonText = job.artifacts?.projectJsonText;
          if (!jsonText) {
            sendJson(res, 500, { error: "Project JSON not available" });
            return;
          }
          sendBytes(res, 200, jsonText, "application/json; charset=utf-8", {
            "Content-Disposition": `attachment; filename="vibescan-${scanId}.json"`,
          });
          return;
        }

        if (req.method === "GET" && tail === "report.sarif") {
          if (job.state !== "done") {
            sendJson(res, 409, { error: `Scan not ready (state: ${job.state})` });
            return;
          }
          const sarifText = job.artifacts?.sarifText;
          if (!sarifText) {
            sendJson(res, 500, { error: "SARIF not available" });
            return;
          }
          sendBytes(res, 200, sarifText, "application/sarif+json; charset=utf-8", {
            "Content-Disposition": `attachment; filename="vibescan-${scanId}.sarif"`,
          });
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

