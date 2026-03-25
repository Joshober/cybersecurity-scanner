import { describe, it } from "node:test";
import assert from "node:assert";
import {
  expressPathToProbePath,
  probeHttpRoutes,
} from "../../dist/system/httpProbe.js";

describe("http probe", () => {
  it("expressPathToProbePath replaces params", () => {
    assert.strictEqual(expressPathToProbePath("/users/:id"), "/users/1");
    assert.strictEqual(expressPathToProbePath("/a/:x/b/:y"), "/a/1/b/1");
  });

  it("probeHttpRoutes uses fetchImpl and records status", async () => {
    const routes = [
      {
        method: "GET",
        path: "/ok",
        fullPath: "/ok",
        params: [],
        bodyFields: [],
        queryFields: [],
        paramsFields: [],
        middlewares: [],
        file: "/app/routes.js",
        line: 10,
        handlerSource: "",
      },
    ];
    const fetchImpl = async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } });

    const findings = await probeHttpRoutes("http://127.0.0.1:9", routes, {
      maxRoutes: 5,
      fetchImpl,
    });
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].ruleId, "probe.http.response");
    assert.match(findings[0].message, /GET http:\/\/127\.0\.0\.1:9\/ok → 200/);
  });
});
