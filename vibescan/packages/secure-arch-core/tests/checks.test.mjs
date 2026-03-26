import { test } from "node:test";
import assert from "node:assert";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadArchitectureSettings, runSettingsChecks } from "../dist/index.js";

test("ARCH-001 when database internet exposed", () => {
  const dir = mkdtempSync(join(tmpdir(), "sa-"));
  try {
    writeFileSync(
      join(dir, "settings.global.yaml"),
      `
schemaVersion: "1"
project: { name: "t" }
environments:
  production:
    database:
      exposure: internet
      publiclyReachable: true
    authentication: { enabled: true, mechanisms: [jwt] }
    authorization: { model: rbac, enforcedEverywhere: true }
    secrets: { storage: vault, embeddedInRepo: false }
    cors: { allowCredentials: false, origins: [] }
    network: { ingressPublic: false, defaultDenyBetweenServices: true }
    storage: { publicBuckets: false }
    deployment: { target: k8s, debugEnabledInProduction: false }
    envIsolation: { separateAccountsOrProjects: true, sharedDatabaseAcrossEnvs: false }
    trustBoundaries: { frontendMayReachDatabaseDirectly: false, publicApiReachesInternalAdmin: false }
    serviceCommunication: { allowlistEnforced: true, overlyPermissiveIam: false }
`,
      "utf-8"
    );
    const { facts } = loadArchitectureSettings(dir);
    const findings = runSettingsChecks({ facts, settingsDir: dir });
    assert.ok(findings.some((f) => f.ruleId === "ARCH-001"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
