import { describe, it } from "node:test";
import assert from "node:assert";
import { scanProject } from "../../dist/system/scanner.js";

describe("AUTH-004 admin routes", () => {
  it("flags unauthenticated POST /admin without generic AUTH-003", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/admin/users', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const ids = project.findings.map((f) => f.ruleId);
    assert.ok(ids.includes("AUTH-004"), `expected AUTH-004, got ${ids.join(",")}`);
    assert.ok(!ids.includes("AUTH-003"), "should not duplicate AUTH-003 for admin path");
  });

  it("safe: requireAuth middleware reference before admin handler avoids AUTH-004", () => {
    const source = `
const express = require('express');
const app = express();
function requireAuth(req, res, next) { next(); }
app.post('/admin/users', requireAuth, (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const auth4 = project.findings.filter((f) => f.ruleId === "AUTH-004");
    assert.strictEqual(auth4.length, 0);
  });

  const adminPatterns = [
    ["/moderator/queue", "POST"],
    ["/mod/action", "POST"],
    ["/reports", "POST"],
    ["/ban/user", "POST"],
    ["/suspend/user", "POST"],
    ["/delete-user/1", "POST"],
  ];

  for (const [path, method] of adminPatterns) {
    it(`AUTH-004 for ${method} ${path} without auth`, () => {
      const source = `
const express = require('express');
const app = express();
app.${method.toLowerCase()}('${path}', (req, res) => { res.send('ok'); });
`;
      const project = scanProject([{ path: "app.js", source }], { injection: true });
      assert.ok(
        project.findings.some((f) => f.ruleId === "AUTH-004"),
        `expected AUTH-004 for ${path}`
      );
      assert.ok(!project.findings.some((f) => f.ruleId === "AUTH-003"));
    });

    it(`safe: requireAuth on ${method} ${path}`, () => {
      const source = `
const express = require('express');
const app = express();
function requireAuth(req, res, next) { next(); }
app.${method.toLowerCase()}('${path}', requireAuth, (req, res) => { res.send('ok'); });
`;
      const project = scanProject([{ path: "app.js", source }], { injection: true });
      assert.strictEqual(
        project.findings.filter((f) => f.ruleId === "AUTH-004").length,
        0
      );
    });
  }

  it("AUTH-004 finding includes route metadata", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/admin/x', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "routes/app.js", source }], { injection: true });
    const f = project.findings.find((x) => x.ruleId === "AUTH-004");
    assert.ok(f?.route);
    assert.strictEqual(f.route.fullPath, "/admin/x");
    assert.strictEqual(f.route.method, "POST");
  });
});
