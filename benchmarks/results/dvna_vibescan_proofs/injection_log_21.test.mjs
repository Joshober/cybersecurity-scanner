// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: injection.log
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\routes\main.js:24
// Log message built from user input without sanitization can lead to log injection.

import { test } from 'node:test';
import assert from 'node:assert';

test('injection_log_21: log line injection forges new fields', () => {
  const user = "\\nseverity=INFO admin=true";
  let line = '';
  function logMsg(m) { line += String(m); }
  logMsg('event=user_login ' + user);
  assert.ok(line.includes('admin=true'), 'Newline/control chars can forge trailing fields');
});
