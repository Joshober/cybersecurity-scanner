/**
 * Template for a proof-capable rule family (copy to `generators/yourRule.ts`).
 *
 * Checklist:
 * - [ ] `supports(f)` matches your ruleId / findingKind
 * - [ ] `emit` returns deterministic local tests when possible (`node --test`)
 * - [ ] Set `failureCode` from `proof/taxonomy.ts` when status is not fully provable
 * - [ ] Add fixture under `tests/fixtures/` and a unit test
 * - [ ] Register in `proof/registry.ts`
 */

import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

export const yourRuleTemplate: ProofGenerator = {
  id: "template.example",

  supports(_f: Finding): boolean {
    return false;
  },

  emit(_f: Finding, ctx: ProofGenContext): ProofEmitResult {
    void ctx;
    return {
      body: "",
      proofGeneration: {
        status: "unsupported",
        wasGenerated: false,
        autoFilled: [],
        manualNeeded: [],
        generatorId: "template.example",
        failureCode: "unknown",
        notes: "Replace this template with a real generator.",
      },
    };
  },
};
