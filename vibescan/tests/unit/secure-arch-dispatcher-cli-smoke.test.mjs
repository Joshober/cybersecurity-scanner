import { describe, it } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const vendoredJsTsEvidence = join(
  vibescanDir,
  "dist/node_modules/@secure-arch/core/dist/evidence/jsTsEvidence.js"
);

function ensureVendoredSecureArch() {
  // Do not skip when an old vendor tree exists but @secure-arch/core is stale (e.g. after package rename).
  if (
    existsSync(vendoredSecureCli) &&
    existsSync(vendoredJsTsEvidence) &&
    readFileSync(vendoredJsTsEvidence, "utf8").includes("@jobersteadt/vibescan")
  ) {
    return;
  }

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

  it("export-ai-rules writes Cursor rules from vendored adapters (secure-arch + optional vibescan config)", () => {
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
      assert.ok(content.includes("Generated from your project's security policy"), "Expected governance banner.");
      assert.ok(content.includes("Secure architecture — fill YAML settings only"), "Expected rule content marker.");
      assert.ok(content.includes("vibescan/architecture/secure-rules/**/*"), "Expected rule globs marker.");
      assert.ok(existsSync(join(tmpProjectRoot, "vibescan-ai-governance.md")), "Expected generic governance markdown.");
      const pol = JSON.parse(readFileSync(join(tmpProjectRoot, "vibescan.policy.json"), "utf-8"));
      assert.strictEqual(pol.kind, "vibescan.securityPolicyExport");

      assert.ok(!existsSync(join(tmpProjectRoot, ".cursor", "rules", "vibescan-static-scan.mdc")), "No vibescan.config — no static-scan mdc.");

      writeFileSync(
        join(tmpProjectRoot, "vibescan.config.json"),
        JSON.stringify({
          rules: { crypto: true, injection: true },
          severityThreshold: "error",
          aiExport: { tool: "cursor", settings: "vibescan/architecture/secure-rules" },
        }),
        "utf-8"
      );

      const r2 = spawnSync(
        process.execPath,
        [dispatcherCli, "export-ai-rules", "--tool", "cursor", "--root", tmpProjectRoot],
        { cwd: monorepoRoot, encoding: "utf-8" }
      );
      assert.strictEqual(r2.status, 0, r2.stderr || r2.stdout);
      const scanMdc = join(tmpProjectRoot, ".cursor", "rules", "vibescan-static-scan.mdc");
      assert.ok(existsSync(scanMdc));
      assert.ok(readFileSync(scanMdc, "utf-8").includes("VibeScan"));
      assert.ok(readFileSync(scanMdc, "utf-8").includes("Generated from your project's security policy"));
    } finally {
      rmSync(tmpProjectRoot, { recursive: true, force: true });
    }
  });
});

