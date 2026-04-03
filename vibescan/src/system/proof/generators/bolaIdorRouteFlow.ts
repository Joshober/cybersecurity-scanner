import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

export const bolaIdorRouteFlowGenerator: ProofGenerator = {
  id: "route.bola_idor_flow",

  supports(f: Finding): boolean {
    return f.ruleId === "AUTH-005";
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const r = f.route;
    const autoFilled: string[] = [];
    const manualNeeded = [
      "Wire real principals (user A / user B) and resource IDs for your API",
      "Replace mock canAccess with your authorization layer",
    ];

    if (!r) {
      const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: BOLA flow skipped — no route on finding', () => {
  assert.fail('AUTH-005 should include route metadata');
});
`;
      return {
        body,
        proofGeneration: {
          status: "needs_manual_completion",
          wasGenerated: true,
          autoFilled,
          manualNeeded,
          generatorId: "route.bola_idor_flow",
          failureCode: "runtime_route_registration",
          notes: "Object-scoped route flow needs method/fullPath/params from the route graph.",
        },
      };
    }

    autoFilled.push(`method ${r.method}`, `fullPath ${r.fullPath}`, `middlewares: ${JSON.stringify(r.middlewares)}`);

    const params = /:[^/]+/g.exec(r.fullPath) ? r.fullPath.match(/:[^/]+/g)?.map((p) => p.slice(1)) ?? [] : [];
    autoFilled.push(`path params: ${params.join(", ") || "(none)"}`);

    const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

/** Replace with real authz: should user B read resource owned by A? */
function canAccessMock(actor, resourceOwner, _resourceId) {
  return actor === resourceOwner;
}

test('${ctx.safeBaseName}: BOLA / IDOR table (mock identities)', () => {
  const routePattern = ${JSON.stringify(r.fullPath)};
  const cases = [
    { actor: 'B', owner: 'A', resourceId: 'fixture-id-1', expectDeny: true },
  ];
  for (const c of cases) {
    const allowed = canAccessMock(c.actor, c.owner, c.resourceId);
    assert.strictEqual(
      allowed,
      !c.expectDeny,
      'route ' + routePattern + ': actor ' + c.actor + ' vs owner ' + c.owner
    );
  }
});
`;

    return {
      body,
      proofGeneration: {
        status: "needs_manual_completion",
        wasGenerated: true,
        autoFilled,
        manualNeeded,
        generatorId: "route.bola_idor_flow",
        failureCode: "missing_auth_context",
        notes:
          "Table-driven mock for object-scoped routes. Structural metadata from scan only — not a live IDOR proof.",
      },
    };
  },
};

function header(f: Finding): string {
  const loc = f.filePath != null ? `\n// Source: ${escapeBlockComment(f.filePath)}:${f.line}` : "";
  return `// VibeScan local proof-oriented test (no API)
// Rule: ${escapeBlockComment(f.ruleId)}${loc}
// ${escapeBlockComment(f.message)}
`;
}
