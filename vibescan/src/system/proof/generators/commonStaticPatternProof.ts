import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

const STATIC_PATTERN_RULES = new Set([
  "injection.sql.string-concat",
  /** Pattern-only ORM rule (no taint labels); labeled ORM hits use `taint.injection_sink`. */
  "injection.orm.request-in-query",
  "injection.open-redirect",
  "injection.deserialize.untrusted",
  "injection.path-traversal",
  "injection.log",
  "injection.xss",
  "crypto.hash.weak",
  "crypto.secrets.hardcoded",
  "SEC-004",
]);

function header(f: Finding): string {
  const loc = f.filePath != null ? `\n// Source: ${escapeBlockComment(f.filePath)}:${f.line}` : "";
  return `// VibeScan local proof-oriented test (mock / static; no live exploit)
// Rule: ${escapeBlockComment(f.ruleId)}${loc}
// ${escapeBlockComment(f.message)}
`;
}

export const commonStaticPatternProofGenerator: ProofGenerator = {
  id: "pattern.injection_crypto_static",
  harness: { isolation: "mock", notes: "Isolated mocks and static checks for pattern-class findings" },

  supports(f: Finding): boolean {
    return STATIC_PATTERN_RULES.has(f.ruleId) || f.findingKind === "ENV_FALLBACK";
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const rule = f.ruleId;
    let body: string;

    if (rule === "injection.sql.string-concat") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: concatenated SQL includes untrusted fragment', () => {
  const user = ${JSON.stringify("'; DROP TABLE users; --")};
  let executed = '';
  function dbQuery(q) { executed = q; }
  const id = user;
  dbQuery('SELECT * FROM users WHERE id = \"' + id + '\"');
  assert.ok(executed.includes('DROP TABLE'), 'User input should reach SQL string');
});
`;
    } else if (rule === "injection.orm.request-in-query") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: HTTP field reaches ORM where clause (mock)', () => {
  const req = { body: { login: ${JSON.stringify("admin' OR '1'='1")} } };
  let captured = null;
  function mockFindOne(opts) {
    captured = opts;
    return Promise.resolve(null);
  }
  mockFindOne({ where: { login: req.body.login } });
  assert.ok(captured?.where?.login?.includes("'"), 'Request-derived value shapes ORM predicate');
});
`;
    } else if (rule === "injection.open-redirect") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: redirect target taken from request data (mock)', () => {
  const calls = [];
  function resRedirect(loc) { calls.push(String(loc)); }
  const target = 'https://evil.example/phish';
  resRedirect(target);
  assert.ok(calls[0].startsWith('https://evil'), 'Attacker-controlled absolute URL reaches redirect');
});
`;
    } else if (rule === "injection.deserialize.untrusted") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

const FINDING_MESSAGE = ${JSON.stringify(f.message)};

test('${ctx.safeBaseName}: finding describes unsafe deserialization', () => {
  assert.match(FINDING_MESSAGE, /deserializ|unserialize|serialize|remote code|RCE/i);
});
`;
    } else if (rule === "injection.path-traversal") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

test('${ctx.safeBaseName}: path join escapes base without sanitization', () => {
  const user = ${JSON.stringify("../../../etc/passwd")};
  const base = '/var/www/uploads';
  const resolved = path.join(base, user);
  assert.ok(user.includes('..'), 'User segment uses parent-dir traversal');
  assert.ok(resolved.includes('passwd'), 'Resolved path still references target file name');
});
`;
    } else if (rule === "injection.log") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: log line injection forges new fields', () => {
  const user = ${JSON.stringify("\\nseverity=INFO admin=true")};
  let line = '';
  function logMsg(m) { line += String(m); }
  logMsg('event=user_login ' + user);
  assert.ok(line.includes('admin=true'), 'Newline/control chars can forge trailing fields');
});
`;
    } else if (rule === "injection.xss") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: HTML sink receives executable handler payload', () => {
  const payload = "<img src=x onerror=alert(1)>";
  let assigned = '';
  const el = { set innerHTML(v) { assigned = String(v); } };
  el.innerHTML = payload;
  assert.ok(assigned.includes('onerror'), 'Markup sink accepts script-bearing attributes');
});
`;
    } else if (rule === "crypto.hash.weak") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

const FINDING_MESSAGE = ${JSON.stringify(f.message)};

test('${ctx.safeBaseName}: weak hash primitive (MD5/SHA-1) is unsuitable for passwords', () => {
  assert.match(FINDING_MESSAGE, /md5|sha-?1/i, 'Finding should name a weak hash');
  const h = crypto.createHash('md5').update('pw').digest('hex');
  assert.strictEqual(h.length, 32, 'Sanity: MD5 digest shape (do not use for passwords)');
});
`;
    } else if (rule === "crypto.secrets.hardcoded") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

const FINDING_MESSAGE = ${JSON.stringify(f.message)};

test('${ctx.safeBaseName}: hardcoded secret pattern documented by scanner', () => {
  assert.match(FINDING_MESSAGE, /secret|hardcoded|password|token|key/i);
});
`;
    } else if (rule === "SEC-004" || f.findingKind === "ENV_FALLBACK") {
      body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: env var fallback supplies guessable default', () => {
  const prior = process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF;
  try {
    delete process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF;
    const secret = process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF || 'fallback-default-secret';
    assert.strictEqual(secret, 'fallback-default-secret');
  } finally {
    if (prior !== undefined) process.env.VIBESCAN_DUMMY_SECRET_FOR_PROOF = prior;
  }
});
`;
    } else {
      body = "";
    }

    if (!body.trim()) {
      return {
        body: "",
        proofGeneration: {
          status: "unsupported",
          wasGenerated: false,
          autoFilled: [],
          manualNeeded: [],
          generatorId: "pattern.injection_crypto_static",
          failureCode: "unknown",
          notes: "No static proof template for this rule id.",
        },
      };
    }

    return {
      body,
      proofGeneration: {
        status: "provable_locally",
        wasGenerated: true,
        autoFilled: [f.ruleId],
        manualNeeded: [],
        generatorId: "pattern.injection_crypto_static",
        deterministic: true,
        requiresNetwork: false,
        notes:
          "Mock or static demonstration of the vulnerability class named by the finding. Does not exercise the original application binary or prove production exploitability.",
      },
    };
  },
};
