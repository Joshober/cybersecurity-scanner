// Next.js App Router route extraction + merged project scan.

import { describe, it } from "node:test";
import assert from "node:assert";
import { resolve } from "node:path";
import { scanProject } from "../../dist/system/scanner.js";

describe("next-route-graph / scanProject", () => {
  it("maps app/api/users/[id]/route.ts to /api/users/:id and extracts GET and POST", () => {
    const projectRoot = resolve("next-test-root");
    const routeFile = resolve("next-test-root/app/api/users/[id]/route.ts");
    const source = `
export async function GET(request) {
  return new Response();
}
export async function POST(request) {
  const x = await request.json();
  return new Response();
}
`;
    const project = scanProject([{ path: routeFile, source }], {
      projectRoot,
      injection: true,
    });
    const get = project.routes.find((r) => r.method === "GET" && r.fullPath === "/api/users/:id");
    const post = project.routes.find((r) => r.method === "POST" && r.fullPath === "/api/users/:id");
    assert.ok(get, `expected GET /api/users/:id, got: ${project.routes.map((r) => `${r.method} ${r.fullPath}`).join(", ")}`);
    assert.ok(post, "expected POST /api/users/:id");
    assert.strictEqual(get.middlewares.length, 0);
  });

  it("strips route groups and resolves src/app layout", () => {
    const projectRoot = resolve("next-src-root");
    const routeFile = resolve("next-src-root/src/app/(dash)/settings/route.ts");
    const source = `export function GET() { return new Response(); }`;
    const project = scanProject([{ path: routeFile, source }], { projectRoot });
    const r = project.routes.find((x) => x.method === "GET");
    assert.ok(r);
    assert.strictEqual(r.fullPath, "/settings");
  });

  it("still extracts Express routes in the same project", () => {
    const projectRoot = resolve("mixed-root");
    const expressFile = resolve("mixed-root/server.js");
    const nextFile = resolve("mixed-root/app/api/ping/route.ts");
    const project = scanProject(
      [
        {
          path: expressFile,
          source: `
const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('ok'));
`,
        },
        { path: nextFile, source: "export function GET() { return new Response(); }" },
      ],
      { projectRoot }
    );
    assert.ok(project.routes.some((r) => r.fullPath === "/health" && r.method === "GET"));
    assert.ok(project.routes.some((r) => r.fullPath === "/api/ping" && r.method === "GET"));
  });
});
