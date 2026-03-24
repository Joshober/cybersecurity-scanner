/**
 * Optional behavioral check: unsigned webhook body is accepted by vulnerable app,
 * fixed app attempts signature verification (returns 400/500 rather than silent ok).
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, before } from "node:test";
import assert from "node:assert";
import request from "supertest";

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(here, "..");

describe("gold-path webhook HTTP behavior", () => {
  let vulnApp;
  let fixedApp;

  before(async () => {
    const v = await import(pathToFileURL(join(demoRoot, "cases/05-webhook/vulnerable/app.js")).href);
    const f = await import(pathToFileURL(join(demoRoot, "cases/05-webhook/fixed/app.js")).href);
    vulnApp = v.app;
    fixedApp = f.app;
  });

  it("vulnerable: accepts POST without signature", async () => {
    const res = await request(vulnApp).post("/webhook").send('{"x":1}').set("Content-Type", "application/json");
    assert.strictEqual(res.status, 200);
  });

  it("fixed: constructEvent rejects missing / invalid signature", async () => {
    const res = await request(fixedApp).post("/webhook").send('{"x":1}').set("Content-Type", "application/json");
    assert.ok(res.status >= 400, `expected error status, got ${res.status}`);
  });
});
