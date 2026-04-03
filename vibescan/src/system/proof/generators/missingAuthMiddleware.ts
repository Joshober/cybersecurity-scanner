import { AUTH_MIDDLEWARE } from "../../utils/middlewareNames.js";
import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

export const missingAuthMiddlewareGenerator: ProofGenerator = {
  id: "route.middleware_missing_auth",

  supports(f: Finding): boolean {
    return f.ruleId === "AUTH-003" || f.ruleId === "AUTH-004";
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const r = f.route;
    const autoFilled: string[] = [];
    const manualNeeded: string[] = [];

    if (!r) {
      const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

test('${ctx.safeBaseName}: structural proof skipped — no route on finding', () => {
  assert.fail('Middleware audit should attach route for AUTH-003/004');
});
`;
      return {
        body,
        proofGeneration: {
          status: "needs_manual_completion",
          wasGenerated: true,
          autoFilled,
          manualNeeded: ["route graph did not attach to this finding"],
          generatorId: "route.middleware_missing_auth",
          failureCode: "runtime_route_registration",
          notes:
            "Structural proof requires method/fullPath/middlewares from the route graph. This does not execute your HTTP stack.",
        },
      };
    }

    autoFilled.push(`method ${r.method}`, `fullPath ${r.fullPath}`, `middlewares: ${JSON.stringify(r.middlewares)}`);

    const strong = r.fullPath.length > 0;
    const status = strong ? "provable_locally" : "needs_manual_completion";
    if (!strong) {
      manualNeeded.push("incomplete route metadata");
    }

    const body = `${header(f)}
import { test } from 'node:test';
import assert from 'node:assert';

const ROUTE = ${JSON.stringify({ method: r.method, fullPath: r.fullPath, middlewares: r.middlewares })};
const AUTH_MARKERS = ${JSON.stringify([...AUTH_MIDDLEWARE])};

test('${ctx.safeBaseName}: route graph shows no recognizable auth middleware (static)', () => {
  const hay = ROUTE.middlewares;
  const recognizedAuth = AUTH_MARKERS.some((n) => hay.some((h) => h === n || h.includes(n) || n.includes(h)));
  assert.strictEqual(recognizedAuth, false, 'Expected missing auth middleware on this route per static audit');
});
`;

    return {
      body,
      proofGeneration: {
        status,
        wasGenerated: true,
        autoFilled,
        manualNeeded,
        generatorId: "route.middleware_missing_auth",
        deterministic: status === "provable_locally",
        notes:
          "Structural/static: encodes Express route graph facts from the scan. Does not prove runtime access to a live server — only that the extracted graph lacks recognizable auth middleware per VibeScan heuristics.",
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
