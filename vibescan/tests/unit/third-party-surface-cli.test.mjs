import { describe, it } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const cli = join(repoRoot, "dist/system/cli/index.js");

describe("CLI --export-third-party-surface", () => {
  it("writes thirdPartySurface sidecar JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "vibescan-third-party-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({
          name: "fixture-app",
          private: true,
          dependencies: { express: "^4.0.0", mysql: "^2.0.0" },
        }),
        "utf-8"
      );
      const appJs = join(dir, "app.js");
      writeFileSync(
        appJs,
        `const express = require('express');
const mysql = require('mysql');
const app = express();
app.post('/api/login', (req, res) => {
  mysql.query("SELECT * FROM users WHERE id=" + req.query.id);
  res.send('ok');
});
`,
        "utf-8"
      );
      const outJson = join(dir, "third-party-surface.json");
      const r = spawnSync(
        process.execPath,
        [cli, "scan", appJs, "--project-root", dir, "--export-third-party-surface", outJson],
        {
          cwd: repoRoot,
          encoding: "utf-8",
        }
      );
      assert.strictEqual(r.status, 1, "expected findings to trip the scan exit code");
      const data = JSON.parse(readFileSync(outJson, "utf-8"));
      assert.ok(data.summary);
      assert.ok(Array.isArray(data.packages));
      assert.ok(data.packages.some((pkg) => pkg.packageName === "mysql"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
