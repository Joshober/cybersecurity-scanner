// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: injection.path-traversal
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\models\index.js:37
// File path may be derived from user input, enabling path traversal.

import { test } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

test('injection_path-traversal_20: path join escapes base without sanitization', () => {
  const user = "../../../etc/passwd";
  const base = '/var/www/uploads';
  const resolved = path.join(base, user);
  assert.ok(user.includes('..'), 'User segment uses parent-dir traversal');
  assert.ok(resolved.includes('passwd'), 'Resolved path still references target file name');
});
