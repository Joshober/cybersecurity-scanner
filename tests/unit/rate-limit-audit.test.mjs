// MW-002 sensitive paths without rate-limit middleware.

import { describe, it } from "node:test";
import assert from "node:assert";
import { scanProject } from "../../dist/system/scanner.js";

describe("MW-002 rate limit on sensitive routes", () => {
  it("flags POST /login without rateLimit in chain", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/login', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    assert.ok(project.findings.some((f) => f.ruleId === "MW-002"));
  });

  it("flags POST /report-abuse without rate limit", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/report-abuse', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    assert.ok(project.findings.some((f) => f.ruleId === "MW-002"));
  });

  it("safe: rateLimit middleware satisfies MW-002 on /register", () => {
    const source = `
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const limiter = rateLimit({ windowMs: 60_000, max: 5 });
app.post('/register', limiter, (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    assert.ok(!project.findings.some((f) => f.ruleId === "MW-002"));
  });

  it("MW-002 finding includes route metadata", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/password/reset', (req, res) => { res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const f = project.findings.find((x) => x.ruleId === "MW-002");
    assert.ok(f?.route);
    assert.match(f.route.fullPath, /password/i);
  });
});
