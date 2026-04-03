import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

export const prototypePollutionGenerator: ProofGenerator = {
  id: "prototype.pollution",

  supports(f: Finding): boolean {
    return (
      f.ruleId === "injection.prototype-pollution.tainted-flow" ||
      f.findingKind === "PROTOTYPE_POLLUTION"
    );
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const sink = f.sinkLabel ?? "unknown_sink";
    const autoFilled = [`sinkLabel: ${sink}`, "vulnerableMergeForProof harness (explicit __proto__ branch)"];
    const manualNeeded: string[] = [];
    if (!f.sinkLabel) {
      manualNeeded.push("sinkLabel missing; real app merge may differ");
    }

    const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

/** Intentionally unsafe merge pattern for local demonstration (not production code). */
function vulnerableMergeForProof(target, source) {
  for (const key of Object.keys(source)) {
    if (key === '__proto__') {
      Object.assign(Object.prototype, source[key]);
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      vulnerableMergeForProof(target[key] ??= {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

test('${ctx.safeBaseName}: __proto__ branch can pollute Object.prototype (local harness)', () => {
  const payload = JSON.parse('{"__proto__":{"polluted":true}}');
  try {
    const before = Object.getOwnPropertyNames(Object.prototype);
    vulnerableMergeForProof({}, payload);
    const after = Object.getOwnPropertyNames(Object.prototype);
    assert.notDeepStrictEqual(after, before, 'Prototype should change after unsafe merge');
    assert.strictEqual(({}).polluted, true);
  } finally {
    delete Object.prototype.polluted;
  }
});
`;

    return {
      body,
      proofGeneration: {
        status: "provable_locally",
        wasGenerated: true,
        autoFilled,
        manualNeeded,
        generatorId: "prototype.pollution",
        deterministic: true,
        requiresNetwork: false,
        notes:
          "Local harness demonstrates a classic __proto__ merge hazard; does not execute your application code. sinkLabel: " +
          sink +
          ".",
      },
    };
  },
};

function header(f: Finding): string {
  const loc = f.filePath != null ? `\n// Source: ${escapeBlockComment(f.filePath)}:${f.line}` : "";
  return `// VibeScan local proof-oriented test (no API)
// Rule: ${escapeBlockComment(f.ruleId)}${loc}
// sinkLabel: ${escapeBlockComment(f.sinkLabel ?? "(none)")}
// ${escapeBlockComment(f.message)}
`;
}
