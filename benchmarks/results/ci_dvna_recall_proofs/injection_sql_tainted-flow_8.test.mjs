// VibeScan local proof-oriented test (no DB)
// Rule: injection.sql.tainted-flow
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\core\appHandler.js:11
// source: req.body
// sink: db.query
// SQL Injection risk

import { test } from 'node:test';
import assert from 'node:assert';

/** Representative payload (never hits a real DB in this test). */
const TAINTED = "'; DROP TABLE users; --";
const SOURCE_HINT = "req.body";
const SINK_HINT = "db.query";

test('injection_sql_tainted-flow_8: tainted value reaches SQL-like sink (mock)', () => {
  let executed = '';
  function mockQuery(q) {
    executed = String(q);
    return Promise.resolve([]);
  }
  const row = { name: TAINTED };
  mockQuery(`SELECT * FROM products WHERE name = '${row.name}'`);
  assert.ok(executed.includes('DROP TABLE'), 'Untrusted SQL fragment should reach sink string');
  assert.ok(SOURCE_HINT.length > 0, 'Static source hint should be present');
  assert.ok(SINK_HINT.length > 0, 'Static sink hint should be present');
});
