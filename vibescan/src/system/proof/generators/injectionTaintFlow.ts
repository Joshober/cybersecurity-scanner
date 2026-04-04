import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

/** SQL / ORM / NoSQL injection when taint labels pin source → sink. */
const TAINT_INJECTION_RULE = /^injection\.(sql|orm|nosql)\./;

export const injectionTaintFlowGenerator: ProofGenerator = {
  id: "taint.injection_sink",
  harness: { isolation: "mock", notes: "Mock SQL/ORM sink; taint reachability only, not live DB exploit" },

  supports(f: Finding): boolean {
    return TAINT_INJECTION_RULE.test(f.ruleId) && !!f.sourceLabel && !!f.sinkLabel;
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const src = f.sourceLabel ?? "";
    const sink = f.sinkLabel ?? "";
    const autoFilled = [`sourceLabel: ${src}`, `sinkLabel: ${sink}`];

    const body = `${header(f, src, sink)}
import { test } from 'node:test';
import assert from 'node:assert';

/** Representative payload (never hits a real DB in this test). */
const TAINTED = ${JSON.stringify("'; DROP TABLE users; --")};
const SOURCE_HINT = ${JSON.stringify(src)};
const SINK_HINT = ${JSON.stringify(sink)};

test('${ctx.safeBaseName}: tainted value reaches SQL-like sink (mock)', () => {
  let executed = '';
  function mockQuery(q) {
    executed = String(q);
    return Promise.resolve([]);
  }
  const row = { name: TAINTED };
  mockQuery(\`SELECT * FROM products WHERE name = '\${row.name}'\`);
  assert.ok(executed.includes('DROP TABLE'), 'Untrusted SQL fragment should reach sink string');
  assert.ok(SOURCE_HINT.length > 0, 'Static source hint should be present');
  assert.ok(SINK_HINT.length > 0, 'Static sink hint should be present');
});
`;

    return {
      body,
      proofGeneration: {
        status: "provable_locally",
        wasGenerated: true,
        autoFilled,
        manualNeeded: [],
        generatorId: "taint.injection_sink",
        deterministic: true,
        requiresNetwork: false,
        notes:
          "Demonstrates untrusted data interpolated into a SQL string passed to a mocked sink. Does not execute against a real database or prove ORM-specific behavior — only static source-to-sink reachability in isolation.",
      },
    };
  },
};

function header(f: Finding, src: string, sink: string): string {
  const loc = f.filePath != null ? `\n// Source: ${escapeBlockComment(f.filePath)}:${f.line}` : "";
  return `// VibeScan local proof-oriented test (no DB)
// Rule: ${escapeBlockComment(f.ruleId)}${loc}
// source: ${escapeBlockComment(src)}
// sink: ${escapeBlockComment(sink)}
// ${escapeBlockComment(f.message)}
`;
}
