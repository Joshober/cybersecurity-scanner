// Proof-oriented test generation + scanAsync wrapper.

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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

describe("generateTests (proof-oriented)", () => {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), "vibescan-gentest-"));
  });
  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("JWT proof runs with weak literal + bundled crypto helper", () => {
    const findings = [
      minimalFinding({
        ruleId: "crypto.jwt.weak-secret-literal",
        category: "crypto",
        proofHints: { weakJwtSecretLiteral: "secret" },
        filePath: join(dir, "sign.js"),
      }),
    ];
    const out = generateTests(findings, dir);
    assert.strictEqual(out.length, 1);
    assert.ok(existsSync(join(dir, "vibescan-proof-crypto.mjs")));
    const src = readFileSync(out[0], "utf8");
    assert.match(src, /vibescan-proof-crypto\.mjs/);
    assert.match(src, /forgeHs256/);
    assert.ok(findings[0].proofGeneration);
    assert.strictEqual(findings[0].proofGeneration.generatorId, "jwt.weak_secret");
    const r = spawnSync(process.execPath, ["--test", out[0]], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  });

  it("AUTH-004 emits structural route proof (no remote CONFIG)", () => {
    const findings = [
      minimalFinding({
        ruleId: "AUTH-004",
        message: "admin route",
        category: "injection",
        route: {
          method: "POST",
          path: "/admin",
          fullPath: "/admin",
          middlewares: [],
        },
      }),
    ];
    const out = generateTests(findings, dir);
    assert.strictEqual(out.length, 1);
    const src = readFileSync(out[0], "utf8");
    assert.match(src, /ROUTE/);
    assert.match(src, /AUTH_MARKERS/);
    assert.strictEqual(findings[0].proofGeneration.generatorId, "route.middleware_missing_auth");
  });

  it("unsupported rule yields no file but proofGeneration", () => {
    const findings = [
      minimalFinding({
        ruleId: "injection.__vibescan_fixture_no_proof",
        message: "no generator registered for this synthetic id",
      }),
    ];
    const out = generateTests(findings, dir);
    assert.strictEqual(out.length, 0);
    assert.strictEqual(findings[0].proofGeneration.status, "unsupported");
    assert.strictEqual(findings[0].proofGeneration.wasGenerated, false);
  });
});

describe("scanAsync", () => {
  it("runs static rules regardless of mode", async () => {
    const r = await scanAsync("eval(1)", "x.js", { mode: "ai" });
    assert.ok(r.findings.some((f) => f.ruleId === "injection.eval"));
  });
});
