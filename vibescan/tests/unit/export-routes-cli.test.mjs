// --export-routes writes JSON sidecar (static scan).

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

describe("CLI --export-routes", () => {
  it("writes routeInventory and routes arrays", () => {
    const dir = mkdtempSync(join(tmpdir(), "vibescan-routes-"));
    try {
      const appJs = join(dir, "app.js");
      writeFileSync(
        appJs,
        `const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('ok'));
`,
        "utf-8"
      );
      const outJson = join(dir, "routes-out.json");
      const r = spawnSync(process.execPath, [cli, "scan", appJs, "--export-routes", outJson], {
        cwd: repoRoot,
        encoding: "utf-8",
      });
      assert.strictEqual(r.status, 0, r.stderr || r.stdout);
      const data = JSON.parse(readFileSync(outJson, "utf-8"));
      assert.ok(Array.isArray(data.routeInventory));
      assert.ok(Array.isArray(data.routes));
      assert.ok(data.routes.some((row) => row.fullPath === "/health"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
