import { describe, it } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const vibescanDir = join(__dirname, "../..");
const monorepoRoot = join(vibescanDir, "..");

const dispatcherCli = join(vibescanDir, "dist/system/cli/vibescan.js");
const vendoredSecureCli = join(
  vibescanDir,
  "dist/node_modules/@secure-arch/cli/dist/cli.js"
);
const vendorScript = join(vibescanDir, "scripts/vendor-secure-arch-into-vibescan.mjs");

function ensureVendoredSecureArch() {
  if (existsSync(vendoredSecureCli)) return;

  // Use `cmd.exe` so Windows PATH resolution for `npm` is reliable under the test runner.
  // Avoid nested quoting issues on Windows by passing the prefix path unquoted.
  const cmd = `npm --prefix ${monorepoRoot} run build:arch`;
  const rBuild = spawnSync("cmd.exe", ["/d", "/s", "/c", cmd], { cwd: monorepoRoot, encoding: "utf-8" });
  assert.strictEqual(rBuild.status, 0, rBuild.stderr || rBuild.stdout || String(rBuild.error ?? ""));

  const rVendor = spawnSync(process.execPath, [vendorScript], {
    cwd: monorepoRoot,
    encoding: "utf-8",
  });
  assert.strictEqual(rVendor.status, 0, rVendor.stderr || rVendor.stdout);

  assert.ok(existsSync(vendoredSecureCli), "Expected vendored secure-arch CLI after vendoring.");
}

describe("CLI dispatcher - secure-arch", () => {
  it("routes secure-arch check through the dispatcher", () => {
    ensureVendoredSecureArch();

    const r = spawnSync(
      process.execPath,
      [
        dispatcherCli,
        "secure-arch",
        "check",
        "--root",
        monorepoRoot,
        "--code-evidence",
        "off",
        "--format",
        "human",
      ],
      {
        cwd: monorepoRoot,
        encoding: "utf-8",
      }
    );

    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  });

  it("aliases export-ai-rules to secure-arch init (cursor)", () => {
    ensureVendoredSecureArch();

    const tmpProjectRoot = mkdtempSync(join(tmpdir(), "vibescan-secure-arch-init-"));
    try {
      const r = spawnSync(
        process.execPath,
        [
          dispatcherCli,
          "export-ai-rules",
          "--tool",
          "cursor",
          "--root",
          tmpProjectRoot,
        ],
        {
          cwd: monorepoRoot,
          encoding: "utf-8",
        }
      );

      assert.strictEqual(r.status, 0, r.stderr || r.stdout);

      const ruleFile = join(tmpProjectRoot, ".cursor", "rules", "secure-arch-settings.mdc");
      assert.ok(existsSync(ruleFile), "Expected Cursor rule file to be generated.");

      const content = readFileSync(ruleFile, "utf-8");
      assert.ok(content.includes("Secure architecture — fill YAML settings only"), "Expected rule content marker.");
      assert.ok(content.includes("architecture/secure-rules/**/*"), "Expected rule globs marker.");
    } finally {
      rmSync(tmpProjectRoot, { recursive: true, force: true });
    }
  });
});

