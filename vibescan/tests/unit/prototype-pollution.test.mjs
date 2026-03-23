import test from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

test("prototype pollution rule", async (t) => {
  await t.test("vulnerable: Object.assign with req.body flagged", () => {
    const src = `
      app.post('/merge', (req, res) => {
        const user = {};
        Object.assign(user, req.body);
        res.send('ok');
      });
    `;
    const r = scanSource(src, "proto-vuln.js");
    assertHasRuleId(r, "RULE-PROTO-001");
  });

  await t.test("vulnerable: lodash set with __proto__ path flagged", () => {
    const src = `
      function handler(req) {
        _.set(config, "__proto__.polluted", req.body.value);
      }
    `;
    const r = scanSource(src, "proto-set-vuln.js");
    assertHasRuleId(r, "RULE-PROTO-001");
  });

  await t.test("safe: merge with static object not flagged", () => {
    const src = `
      const defaults = { retries: 3 };
      const cfg = merge(defaults, { timeout: 1000 });
      console.log(cfg);
    `;
    const r = scanSource(src, "proto-safe.js");
    assertNoRuleId(r, "RULE-PROTO-001");
  });
});
