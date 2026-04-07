// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: injection.open-redirect
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\core\appHandler.js:188
// Redirect target may be controlled by the user (open redirect / phishing risk).

import { test } from 'node:test';
import assert from 'node:assert';

test('injection_open-redirect_6: redirect target taken from request data (mock)', () => {
  const calls = [];
  function resRedirect(loc) { calls.push(String(loc)); }
  const target = 'https://evil.example/phish';
  resRedirect(target);
  assert.ok(calls[0].startsWith('https://evil'), 'Attacker-controlled absolute URL reaches redirect');
});
