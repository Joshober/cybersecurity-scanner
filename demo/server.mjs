import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import fg from "fast-glob";

const PUBLIC_DIR = path.resolve(process.cwd(), "demo/public");
const TMP_DIR = path.resolve(process.cwd(), "demo/.tmp");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// In-memory job store (demo server is intended to be short-lived).
const jobs = new Map();

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

    const distIndex = path.resolve(process.cwd(), "vibescan/dist/system/index.js");
    if (!existsSync(distIndex)) {
      throw new Error(
        `Scanner build not found at ${distIndex}. Run 'npm run build -w vibescan' from the repo root first.`
      );
    }

    const scanner = await import(pathToFileURL(distIndex).href);
    const scanProjectAsync = scanner.scanProjectAsync;

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

    job.result = {
      repoGitUrl,
      scenario,
      blocked,
      totalFindings: findings.length,
      criticalOrErrorCount: criticalOrError.length,
      countsBySeverity,
      topFindings,
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
        const scanId = pathname.split("/").pop();
        const job = jobs.get(scanId);
        if (!job) {
          sendJson(res, 404, { error: "Unknown scanId" });
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

