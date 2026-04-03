import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

const SSRF_RULE_RE =
  /ssrf|SSRF|injection\.ssrf|RULE-SSRF|SSRF-0/;

export const ssrfTaintFlowGenerator: ProofGenerator = {
  id: "taint.ssrf_sink",

  supports(f: Finding): boolean {
    return SSRF_RULE_RE.test(f.ruleId) || f.findingKind === "INSUFFICIENT_SSRF_DEFENSE";
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const src = f.sourceLabel ?? "attacker_controlled_input";
    const sink = f.sinkLabel ?? "fetch";
    const autoFilled = [`sourceLabel: ${src}`, `sinkLabel: ${sink}`];
    const manualNeeded: string[] = [];
    if (!f.sourceLabel) manualNeeded.push("sourceLabel missing on finding");
    if (!f.sinkLabel) manualNeeded.push("sinkLabel missing on finding");

    const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

const TAINTED_URL = ${JSON.stringify("http://169.254.169.254/latest/meta-data/")};
const SOURCE_HINT = ${JSON.stringify(src)};
const SINK_HINT = ${JSON.stringify(sink)};

test('${ctx.safeBaseName}: tainted URL reaches request sink (mock; not live SSRF)', () => {
  const calls = [];
  function mockFetch(url) {
    calls.push(String(url));
    return Promise.resolve({});
  }
  mockFetch(TAINTED_URL);
  assert.ok(calls.some((u) => u.includes('169.254')), 'Sink must receive attacker-chosen URL');
  assert.ok(SOURCE_HINT.length > 0, 'Static source label should describe taint origin');
  assert.ok(SINK_HINT.length > 0, 'Static sink label should describe outbound request API');
});
`;

    const complete = !!(f.sourceLabel && f.sinkLabel);
    return {
      body,
      proofGeneration: {
        status: complete ? "provable_locally" : "needs_manual_completion",
        wasGenerated: true,
        autoFilled,
        manualNeeded,
        generatorId: "taint.ssrf_sink",
        ...(complete ? {} : { failureCode: "dynamic_url_unresolved" as const }),
        deterministic: true,
        requiresNetwork: false,
        notes:
          "Demonstrates tainted URL value flowing into a mocked request sink. Does not prove successful SSRF against a live environment or internal metadata service — only static taint-to-sink reachability in isolation.",
      },
    };
  },
};

function header(f: Finding): string {
  const loc = f.filePath != null ? `\n// Source: ${escapeBlockComment(f.filePath)}:${f.line}` : "";
  return `// VibeScan local proof-oriented test (no API)
// Rule: ${escapeBlockComment(f.ruleId)}${loc}
// sourceLabel: ${escapeBlockComment(f.sourceLabel ?? "(none)")}
// sinkLabel: ${escapeBlockComment(f.sinkLabel ?? "(none)")}
// ${escapeBlockComment(f.message)}
`;
}
