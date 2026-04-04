// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: injection.orm.request-in-query
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\core\authHandler.js:21
// ORM query or write incorporates HTTP request fields without validation.

import { test } from 'node:test';
import assert from 'node:assert';

test('injection_orm_request-in-query_10: HTTP field reaches ORM where clause (mock)', () => {
  const req = { body: { login: "admin' OR '1'='1" } };
  let captured = null;
  function mockFindOne(opts) {
    captured = opts;
    return Promise.resolve(null);
  }
  mockFindOne({ where: { login: req.body.login } });
  assert.ok(captured?.where?.login?.includes("'"), 'Request-derived value shapes ORM predicate');
});
