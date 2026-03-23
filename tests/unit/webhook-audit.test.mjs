import { describe, it } from "node:test";
import assert from "node:assert";
import { scanProject } from "../../dist/system/scanner.js";

describe("WEBHOOK-001", () => {
  it("flags POST /webhook using req.body without verification hints", () => {
    const source = `
const express = require('express');
const app = express();
app.post('/webhook', (req, res) => { const x = req.body; res.send('ok'); });
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const w = project.findings.filter((f) => f.ruleId === "WEBHOOK-001");
    assert.strictEqual(w.length, 1);
  });

  it("safe: constructEvent in handler suppresses WEBHOOK-001", () => {
    const source = `
const express = require('express');
const stripe = require('stripe');
const app = express();
app.post('/webhook', (req, res) => {
  stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], 'whsec_x');
  res.send('ok');
});
`;
    const project = scanProject([{ path: "app.js", source }], { injection: true });
    const w = project.findings.filter((f) => f.ruleId === "WEBHOOK-001");
    assert.strictEqual(w.length, 0);
  });
});
