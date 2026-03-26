import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  checkDependencies,
  writeSlopsquatFixture,
  rmSlopsquatFixture,
} from "../../dist/system/ai/slopsquat.js";

describe("slopsquat SLOP-001", () => {
  let root;
  before(() => {
    root = mkdtempSync(join(tmpdir(), "vibescan-slop-"));
  });
  after(() => {
    if (root) rmSlopsquatFixture(root);
  });

  it("flags 404 unscoped package as SLOPSQUAT_CANDIDATE", async () => {
    const pj = writeSlopsquatFixture(join(root, "a"), {
      deps: { lodash: "^4.0.0", "totally-fake-pkg-xyz123": "1.0.0" },
    });
    const fetchImpl = async (url) => {
      if (url.includes("lodash")) return { status: 200 };
      return { status: 404 };
    };
    const findings = await checkDependencies(pj, { fetchImpl });
    const slop = findings.filter((f) => f.findingKind === "SLOPSQUAT_CANDIDATE");
    assert.strictEqual(slop.length, 1);
    assert.strictEqual(slop[0].packageName, "totally-fake-pkg-xyz123");
    assert.strictEqual(slop[0].ruleId, "SLOP-001");
  });

  it("scoped 404 → POSSIBLY_PRIVATE", async () => {
    const pj = writeSlopsquatFixture(join(root, "b"), {
      deps: { "@acme/not-a-real-pkg-for-vibescan": "1.0.0" },
    });
    const findings = await checkDependencies(pj, {
      fetchImpl: async () => ({ status: 404 }),
    });
    assert.ok(findings.some((f) => f.findingKind === "POSSIBLY_PRIVATE"));
  });

  it("skips dependencies that are workspace package names", async () => {
    const sub = join(root, "ws");
    const pj = writeSlopsquatFixture(sub, {
      deps: { "@my/ws-pkg": "1.0.0" },
      workspaces: ["packages/*"],
      workspacePackages: [{ path: "packages/ws-pkg", name: "@my/ws-pkg" }],
    });
    const findings = await checkDependencies(pj, {
      fetchImpl: async () => ({ status: 404 }),
    });
    assert.strictEqual(findings.length, 0);
  });

  it("skips registry check when .npmrc sets non-npmjs registry", async () => {
    const sub = join(root, "rc");
    mkdirSync(sub, { recursive: true });
    const pj = writeSlopsquatFixture(sub, { deps: { "fake-pkg-abc": "1.0.0" } });
    writeFileSync(join(sub, ".npmrc"), "registry=https://registry.example.com/\n", "utf-8");
    const findings = await checkDependencies(pj, {
      fetchImpl: async () => ({ status: 404 }),
    });
    assert.strictEqual(findings.length, 0);
  });
});
