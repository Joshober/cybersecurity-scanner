// Generated security tests template quality + scanAsync wrapper.

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { generateTests } from "../../dist/system/engine/testWriter.js";
import { scanAsync } from "../../dist/system/scanner.js";

const minimalFinding = (overrides) => ({
  message: "test finding",
  severity: "error",
  severityLabel: "HIGH",
  category: "injection",
  line: 1,
  column: 0,
  ...overrides,
});

describe("generateTests", () => {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), "vibescan-gentest-"));
  });
  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("JWT template is runnable and contains no TODO placeholders", () => {
    const findings = [
      minimalFinding({
        ruleId: "crypto.jwt.weak-secret-literal",
        category: "crypto",
      }),
    ];
    const out = generateTests(findings, dir);
    assert.strictEqual(out.length, 1);
    assert.ok(existsSync(join(dir, "vibescan-test-config.mjs")));
    const src = readFileSync(out[0], "utf8");
    assert.match(src, /vibescan-test-config\.mjs/);
    assert.match(src, /forgeHs256/);
    assert.match(src, /createHmac/);
    assert.match(src, /CONFIG\.jwtOracleBase/);
    assert.ok(!src.toLowerCase().includes("todo:"));
    const r = spawnSync(process.execPath, ["--test", out[0]], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  });

  it("AUTH template uses CONFIG for BOLA oracles", () => {
    const findings = [
      minimalFinding({
        ruleId: "AUTH-004",
        message: "admin route",
        route: {
          method: "POST",
          path: "/admin",
          fullPath: "/admin",
          middlewares: [],
        },
      }),
    ];
    const out = generateTests(findings, dir);
    const src = readFileSync(out[0], "utf8");
    assert.match(src, /vibescanTestDefaults/);
    assert.match(src, /CONFIG\.apiBase/);
    assert.match(src, /CONFIG\.tokenUserA/);
    assert.ok(!src.toLowerCase().includes("todo:"));
  });

  it("generic rule uses CONFIG for HTTP oracle", () => {
    const findings = [
      minimalFinding({
        ruleId: "injection.sql.string-concat",
        message: "sql",
      }),
    ];
    const out = generateTests(findings, dir);
    const src = readFileSync(out[0], "utf8");
    assert.match(src, /CONFIG\.oracleBase/);
    assert.ok(!src.toLowerCase().includes("todo:"));
  });

  it("vibescan.tests.json beside helper merges into generated CONFIG via defaults helper", () => {
    const findings = [
      minimalFinding({
        ruleId: "injection.sql.string-concat",
        message: "sql",
      }),
    ];
    writeFileSync(
      join(dir, "vibescan.tests.json"),
      JSON.stringify({ oracleBase: "https://example.invalid" }),
      "utf8"
    );
    generateTests(findings, dir, { projectRoot: dir });
    const testFile = findings[0].generatedTest;
    const helperSrc = readFileSync(join(dir, "vibescan-test-config.mjs"), "utf8");
    assert.match(helperSrc, /vibescan\.tests\.json/);
    const r = spawnSync(process.execPath, ["-e", `import('./vibescan-test-config.mjs').then(m => { const b = m.vibescanTestDefaults(); if (b.oracleBase !== 'https://example.invalid') process.exit(2); });`], {
      encoding: "utf8",
      cwd: dir,
    });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    const src = readFileSync(testFile, "utf8");
    assert.match(src, /vibescanTestDefaults/);
  });
});

describe("scanAsync", () => {
  it("runs static rules regardless of mode", async () => {
    const r = await scanAsync("eval(1)", "x.js", { mode: "ai" });
    assert.ok(r.findings.some((f) => f.ruleId === "injection.eval"));
  });
});
