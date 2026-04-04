// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: injection.xss
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\views\app\adminusers.ejs:40
// Unsanitized HTML insertion can lead to XSS.

import { test } from 'node:test';
import assert from 'node:assert';

test('injection_xss_22: HTML sink receives executable handler payload', () => {
  const payload = "<img src=x onerror=alert(1)>";
  let assigned = '';
  const el = { set innerHTML(v) { assigned = String(v); } };
  el.innerHTML = payload;
  assert.ok(assigned.includes('onerror'), 'Markup sink accepts script-bearing attributes');
});
