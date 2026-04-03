import { readFileSync, existsSync } from "node:fs";
import { JWT_WEAK_SECRET_TEST } from "../../../attacks/crypto/jwt-weak-test.js";
import { escapeBlockComment } from "../emitUtils.js";
import type { ProofEmitResult, ProofGenContext, ProofGenerator } from "../types.js";
import type { Finding } from "../../types.js";

function fileLikelyHasJwtVerifyWithSecret(source: string, secret: string): boolean {
  if (!source.includes("jwt.verify") && !source.includes("jsonwebtoken.verify")) return false;
  const q = JSON.stringify(secret);
  return (
    source.includes(q) ||
    source.includes(`'${secret.replace(/'/g, "\\'")}'`) ||
    source.includes(`"${secret.replace(/"/g, '\\"')}"`)
  );
}

export const jwtWeakSecretGenerator: ProofGenerator = {
  id: "jwt.weak_secret",
  harness: { isolation: "pure", notes: "HS256 sign/verify without network" },

  supports(f: Finding): boolean {
    return f.ruleId === "crypto.jwt.weak-secret-literal";
  },

  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult {
    const secret = f.proofHints?.weakJwtSecretLiteral;
    const claims = JWT_WEAK_SECRET_TEST.forgedPayload;
    const autoFilled: string[] = [];
    const manualNeeded: string[] = [];

    let strongVerify = false;
    if (f.filePath && secret && existsSync(f.filePath)) {
      try {
        const src = readFileSync(f.filePath, "utf-8");
        strongVerify = fileLikelyHasJwtVerifyWithSecret(src, secret);
        if (strongVerify) autoFilled.push("jwt.verify/jsonwebtoken.verify in same file as weak sign literal");
      } catch {
        manualNeeded.push("could not read source file for verify-path heuristic");
      }
    } else if (!secret) {
      manualNeeded.push("weakJwtSecretLiteral not on finding; re-run scan with current rule engine");
    }

    if (!secret) {
      return {
        body: "",
        proofGeneration: {
          status: "needs_manual_completion",
          wasGenerated: false,
          autoFilled,
          manualNeeded: ["proofHints.weakJwtSecretLiteral — re-scan with current VibeScan"],
          generatorId: "jwt.weak_secret",
          failureCode: "environment_secret_required",
          notes:
            "No weak JWT literal on finding; cannot emit a local HS256 proof. Re-run static scan so the rule attaches proofHints.",
        },
      };
    }

    const status: "provable_locally" | "needs_manual_completion" = strongVerify
      ? "provable_locally"
      : "needs_manual_completion";
    if (!strongVerify) {
      manualNeeded.push(
        "Link to app jwt.verify: if verification uses the same weak literal, this test still proves HS256 accepts forged tokens with that secret (generic verify)."
      );
    }
    autoFilled.push("HS256 forge + verify with reported weak literal");
    if (strongVerify) autoFilled.push("static heuristic: jwt.verify present in same source file");

    const notes = strongVerify
      ? "Local proof: forged HS256 token verifies with the same secret material as the weak signing literal; same-file jwt.verify heuristic suggests app verification may accept it."
      : "Local proof: demonstrates HS256 tokens signed with the weak literal verify with that secret. Does not prove your app’s jwt.verify path without aligning code review.";

    const body = `${proofHeader(f)}
import { test } from 'node:test';
import assert from 'node:assert';
import { forgeHs256, verifyHs256Accepts } from './vibescan-proof-crypto.mjs';

const WEAK_LITERAL = ${JSON.stringify(secret)};
const CLAIMS = ${JSON.stringify(claims)};

test('${ctx.safeBaseName}: forged HS256 with weak literal verifies locally', () => {
  const token = forgeHs256(CLAIMS, WEAK_LITERAL);
  assert.ok(verifyHs256Accepts(token, WEAK_LITERAL), 'HS256 token must verify with the same weak secret');
  assert.match(token, /^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/);
});
`;
    return {
      body,
      proofGeneration: {
        status,
        wasGenerated: true,
        autoFilled,
        manualNeeded,
        generatorId: "jwt.weak_secret",
        notes,
        deterministic: true,
        requiresNetwork: false,
        requiresSecrets: false,
        ...(status === "needs_manual_completion"
          ? { failureCode: "missing_auth_context" as const }
          : {}),
      },
    };
  },
};

function proofHeader(f: Finding): string {
  const loc = f.filePath != null ? `\n// Source: ${escapeBlockComment(f.filePath)}:${f.line}` : "";
  return `// VibeScan local proof-oriented test (no API; deterministic)
// Rule: ${escapeBlockComment(f.ruleId)}${loc}
// ${escapeBlockComment(f.message)}
`;
}
