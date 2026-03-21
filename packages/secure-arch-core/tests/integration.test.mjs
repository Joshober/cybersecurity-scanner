import { test } from "node:test";
import assert from "node:assert";
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runArchitectureCheck, shouldFail } from "../dist/index.js";

test("js-ts evidence maps MW-004 to ARCH-E001", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sa-"));
  try {
    const settingsDir = join(dir, "architecture", "secure-rules");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(
      join(settingsDir, "settings.global.yaml"),
      `
schemaVersion: "1"
project: { name: "t" }
environments:
  production:
    database: { exposure: internal, publiclyReachable: false }
    authentication: { enabled: true, mechanisms: [jwt] }
    authorization: { model: rbac, enforcedEverywhere: true }
    secrets: { storage: env_vars, embeddedInRepo: false }
    cors: { allowCredentials: false, origins: ["https://a.com"] }
    network: { ingressPublic: true, defaultDenyBetweenServices: true }
    storage: { publicBuckets: false }
    deployment: { target: node, debugEnabledInProduction: false }
    envIsolation: { separateAccountsOrProjects: true, sharedDatabaseAcrossEnvs: false }
    trustBoundaries: { frontendMayReachDatabaseDirectly: false, publicApiReachesInternalAdmin: false }
    serviceCommunication: { allowlistEnforced: true, overlyPermissiveIam: false }
`,
      "utf-8"
    );
    const srcDir = join(dir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(
      join(srcDir, "app.js"),
      `const cors = require('cors'); const app = require('express')(); app.use(cors({ origin: '*' }));`,
      "utf-8"
    );
    const res = await runArchitectureCheck({
      settingsDir,
      projectRoot: dir,
      codeEvidence: "js-ts",
      scanPaths: ["src"],
    });
    assert.ok(res.findings.some((f) => f.ruleId === "ARCH-E001"));
    assert.strictEqual(shouldFail(res.findings), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("heuristic all mode finds python pattern", async () => {
  const dir = mkdtempSync(join(tmpdir(), "sa-"));
  try {
    const settingsDir = join(dir, "architecture", "secure-rules");
    mkdirSync(settingsDir, { recursive: true });
    writeFileSync(
      join(settingsDir, "settings.global.yaml"),
      `
schemaVersion: "1"
project: { name: "t" }
environments:
  production:
    database: { exposure: internal, publiclyReachable: false }
    authentication: { enabled: true, mechanisms: [jwt] }
    authorization: { model: rbac, enforcedEverywhere: true }
    secrets: { storage: vault, embeddedInRepo: false }
    cors: { allowCredentials: false, origins: [] }
    network: { ingressPublic: false, defaultDenyBetweenServices: true }
    storage: { publicBuckets: false }
    deployment: { target: lambda, debugEnabledInProduction: false }
    envIsolation: { separateAccountsOrProjects: true, sharedDatabaseAcrossEnvs: false }
    trustBoundaries: { frontendMayReachDatabaseDirectly: false, publicApiReachesInternalAdmin: false }
    serviceCommunication: { allowlistEnforced: true, overlyPermissiveIam: false }
`,
      "utf-8"
    );
    const pyDir = join(dir, "py");
    mkdirSync(pyDir, { recursive: true });
    writeFileSync(join(pyDir, "settings.py"), `CORS_ORIGIN_ALLOW_ALL = True\n`, "utf-8");
    const res = await runArchitectureCheck({
      settingsDir,
      projectRoot: dir,
      codeEvidence: "all",
      scanPaths: ["py"],
    });
    assert.ok(res.findings.some((f) => f.ruleId === "ARCH-H002"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
