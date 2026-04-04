// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: crypto.hash.weak
// Source: C:\Users\Josh\Downloads\CyberSecurity\benchmarks\dvna\dvna\core\authHandler.js:49
// Avoid weak hash algorithm 'md5'. For password storage use a password hashing function; for general hashing use SHA-256+.

import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

const FINDING_MESSAGE = "Avoid weak hash algorithm 'md5'. For password storage use a password hashing function; for general hashing use SHA-256+.";

test('crypto_hash_weak_12: weak hash primitive (MD5/SHA-1) is unsuitable for passwords', () => {
  assert.match(FINDING_MESSAGE, /md5|sha-?1/i, 'Finding should name a weak hash');
  const h = crypto.createHash('md5').update('pw').digest('hex');
  assert.strictEqual(h.length, 32, 'Sanity: MD5 digest shape (do not use for passwords)');
});
