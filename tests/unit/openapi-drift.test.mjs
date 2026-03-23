// OpenAPI vs Express route drift (API-INV-*), discovery, route inventory.

import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanProject } from "../../dist/system/scanner.js";
import {
  discoverOpenApiSpecPaths,
  loadOpenApiOperations,
} from "../../dist/system/engine/openapiDrift.js";
import { formatProjectSarif } from "../../dist/system/sarif.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, "../fixtures/openapi-drift");
const specPath = join(fixtureDir, "openapi.yaml");
const appSource = readFileSync(join(fixtureDir, "app.js"), "utf-8");

describe("OpenAPI drift / inventory", () => {
  it("loadOpenApiOperations extracts HTTP methods from YAML", () => {
    const ops = loadOpenApiOperations(specPath);
    assert.ok(ops.some((o) => o.method === "GET" && o.pathTemplate === "/api/items/{id}"));
    assert.ok(ops.some((o) => o.method === "POST" && o.pathTemplate === "/api/items"));
    assert.ok(ops.some((o) => o.method === "GET" && o.pathTemplate === "/api/legacy/removed"));
  });

  it("scanProject flags undocumented code route and ghost spec operation", () => {
    const project = scanProject([{ path: join(fixtureDir, "app.js"), source: appSource }], {
      injection: false,
      crypto: false,
      openApiSpecPaths: [specPath],
      projectRoot: fixtureDir,
    });
    const inv001 = project.findings.filter((f) => f.ruleId === "API-INV-001");
    const inv002 = project.findings.filter((f) => f.ruleId === "API-INV-002");
    assert.ok(
      inv001.some((f) => f.message.includes("/internal/hidden")),
      `expected API-INV-001 for hidden route, got: ${inv001.map((f) => f.message).join(";")}`
    );
    assert.ok(
      inv002.some((f) => f.message.includes("/api/legacy/removed")),
      `expected API-INV-002 for ghost op, got: ${inv002.map((f) => f.message).join(";")}`
    );
  });

  it("discoverOpenApiSpecPaths finds openapi.yaml under fixture root", () => {
    const found = discoverOpenApiSpecPaths(fixtureDir);
    assert.ok(found.some((p) => p.endsWith("openapi.yaml")));
  });

  it("routeInventory labels object-scoped routes", () => {
    const project = scanProject([{ path: join(fixtureDir, "app.js"), source: appSource }], {
      injection: false,
      crypto: false,
      projectRoot: fixtureDir,
    });
    assert.ok(project.routeInventory);
    const itemGet = project.routeInventory.find((r) => r.fullPath === "/api/items/:id");
    assert.ok(itemGet);
    assert.strictEqual(itemGet.objectScoped, true);
    assert.strictEqual(itemGet.hasAuthMiddleware, false);
    assert.ok(Array.isArray(itemGet.middlewares));
    assert.ok(Array.isArray(itemGet.tags));
  });

  it("formatProjectSarif embeds route inventory in run properties when non-empty", () => {
    const project = scanProject([{ path: join(fixtureDir, "app.js"), source: appSource }], {
      injection: false,
      crypto: false,
      projectRoot: fixtureDir,
    });
    const sarif = JSON.parse(formatProjectSarif(project));
    const run = sarif.runs[0];
    assert.ok(run.properties?.vibescanRouteInventory);
    assert.ok(Array.isArray(run.properties.vibescanRouteInventory));
  });
});
