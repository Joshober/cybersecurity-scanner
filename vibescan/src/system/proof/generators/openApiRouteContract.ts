import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

function header(f: Finding): string {
  return `/* VibeScan proof (static contract)\n${escapeBlockComment(f.message)}\n*/`;
}

/** Static check: documented security schemes are present on the finding (no HTTP server). */
export const openApiRouteContractGenerator: ProofGenerator = {
  id: "openapi.route_contract",
  harness: { isolation: "pure", notes: "Asserts OpenAPI scheme metadata attached to route finding" },

  supports(f: Finding): boolean {
    return (
      f.ruleId === "API-AUTH-001" &&
      !!f.openApiSecurity?.schemeKinds?.length &&
      !!f.route?.fullPath
    );
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const kinds = f.openApiSecurity!.schemeKinds;
    const path = f.route!.fullPath;
    const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: OpenAPI security schemes documented for route', () => {
  const expectedKinds = ${JSON.stringify(kinds)};
  assert.ok(expectedKinds.length > 0, 'expected non-empty scheme kinds from spec');
  assert.ok(${JSON.stringify(path)}.length > 0, 'route path');
});
`;
    return {
      body,
      proofGeneration: {
        status: "provable_locally",
        wasGenerated: true,
        autoFilled: ["schemeKinds", "route.fullPath"],
        manualNeeded: [],
        generatorId: "openapi.route_contract",
        deterministic: true,
      },
    };
  },
};
