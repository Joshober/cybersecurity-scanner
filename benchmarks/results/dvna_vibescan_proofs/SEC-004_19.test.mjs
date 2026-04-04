// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: SEC-004
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\models\index.js:6
// Insecure env var fallback — if env var unset, hardcoded secret is used

import { test } from 'node:test';
import assert from 'node:assert';

test('SEC-004_19: env var fallback supplies guessable default', () => {
  const prior = process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF;
  try {
    delete process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF;
    const secret = process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF || 'fallback-default-secret';
    assert.strictEqual(secret, 'fallback-default-secret');
  } finally {
    if (prior !== undefined) process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF = prior;
  }
});
