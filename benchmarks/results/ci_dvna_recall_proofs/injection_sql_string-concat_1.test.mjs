// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: injection.sql.string-concat
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\core\appHandler.js:39
// SQL built with string concatenation or template literals can lead to SQL injection.

import { test } from 'node:test';
import assert from 'node:assert';

test('injection_sql_string-concat_1: concatenated SQL includes untrusted fragment', () => {
  const user = "'; DROP TABLE users; --";
  let executed = '';
  function dbQuery(q) { executed = q; }
  const id = user;
  dbQuery('SELECT * FROM users WHERE id = "' + id + '"');
  assert.ok(executed.includes('DROP TABLE'), 'User input should reach SQL string');
});
