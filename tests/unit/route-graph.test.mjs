// Route graph extraction + project middleware audit.

import { describe, it } from "node:test";
import assert from "node:assert";
import { scanProject } from "../../dist/system/scanner.js";

describe("route-graph / scanProject", () => {
  it("extracts mounted fullPath and runs middleware audit", () => {
    const source = `
const express = require('express');
const app = express();
const api = express.Router();
app.use('/api', api);
api.post('/login', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const login = project.routes.find((r) => r.fullPath === "/api/login");
    assert.ok(login, `expected /api/login route, got: ${project.routes.map((r) => r.fullPath).join(",")}`);
    assert.strictEqual(login.method, "POST");
    const mw = project.findings.filter((f) => f.ruleId === "AUTH-003" || f.ruleId === "MW-001");
    assert.ok(mw.length >= 1, "expected middleware audit findings for unprotected POST");
  });
});
