import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractRoutes } from "../../src/extractor/astExtractor.js";
import { joinPaths, extractPathParams } from "../../src/extractor/routeGraph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, "../fixtures/extractor-mounts");

describe("routeGraph helpers", () => {
  test("joinPaths", () => {
    expect(joinPaths("", "/api")).toBe("/api");
    expect(joinPaths("/api", "/v1")).toBe("/api/v1");
    expect(joinPaths("/api", "users")).toBe("/api/users");
  });

  test("extractPathParams", () => {
    expect(extractPathParams("/users/:id")).toEqual(["id"]);
  });
});

describe("extractRoutes", () => {
  test("mounts and fullPath", () => {
    const { routes } = extractRoutes(fixtureDir);
    const get = routes.find((r) => r.method === "GET" && r.fullPath.includes("users"));
    expect(get).toBeDefined();
    expect(get.fullPath).toBe("/api/v1/users/:id");
    expect(get.params).toContain("id");
    expect(get.queryParams).toContain("q");
    expect(get.bodyFields).toContain("name");
  });
});
