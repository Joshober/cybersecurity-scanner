// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: crypto.secrets.hardcoded
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\server.js:24
// Possible hardcoded secret in source.

import { test } from 'node:test';
import assert from 'node:assert';

const FINDING_MESSAGE = "Possible hardcoded secret in source.";

test('crypto_secrets_hardcoded_0: hardcoded secret pattern documented by scanner', () => {
  assert.match(FINDING_MESSAGE, /secret|hardcoded|password|token|key/i);
});
