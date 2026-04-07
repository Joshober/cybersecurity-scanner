import { describe, it } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const repoRoot = join(pkgRoot, "..", "..", "..");
const cli = join(pkgRoot, "dist", "cli.js");

describe("@secure-arch/cli", () => {
  it("prints help", () => {
    const r = spawnSync(process.execPath, [cli, "--help"], {
      cwd: repoRoot,
      encoding: "utf-8",
    });
    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
    assert.match(r.stdout, /secure-arch/);
    assert.match(r.stdout, /Commands:/);
  });

  it("runs check in json mode against the repo settings", () => {
    const r = spawnSync(
      process.execPath,
      [cli, "check", "--root", repoRoot, "--code-evidence", "off", "--format", "json"],
      {
        cwd: repoRoot,
        encoding: "utf-8",
      }
    );
    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
    const payload = JSON.parse(r.stdout);
    assert.ok(Array.isArray(payload.loadedSettingsFiles));
    assert.ok(Array.isArray(payload.findings));
    assert.strictEqual(typeof payload.failed, "boolean");
  });
});
