import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Finding, ProofGeneration } from "../types.js";
import { safeProofName } from "./emitUtils.js";
import { proofGenerators } from "./registry.js";
import type { ProofGenContext } from "./types.js";

export interface EmitProofTestsOptions {
  projectRoot?: string;
}

const PROOF_CRYPTO_NAME = "vibescan-proof-crypto.mjs";

function unsupportedResult(): ProofGeneration {
  const msg = "No proof-oriented generator for this rule family or insufficient static context.";
  return {
    status: "unsupported",
    wasGenerated: false,
    autoFilled: [],
    manualNeeded: [],
    generatorId: "unsupported",
    notes: msg,
    failureReason: msg,
    failureCode: "unknown",
  };
}

/** Write local proof-oriented tests for findings; attach proofGeneration to each finding. */
export function emitProofTests(
  findings: Finding[],
  outputDir: string,
  options?: EmitProofTestsOptions
): string[] {
  mkdirSync(outputDir, { recursive: true });

  const cryptoSrc = join(__dirname, "jwtHs256Forge.js");
  writeFileSync(
    join(outputDir, PROOF_CRYPTO_NAME),
    `// Bundled from VibeScan (local HS256 helpers; no network)\n${readFileSync(cryptoSrc, "utf-8")}`,
    "utf-8"
  );

  const written: string[] = [];
  const projectRoot = options?.projectRoot;

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    const safeBaseName = `${safeProofName(f.ruleId)}_${i}`;
    const ctx: ProofGenContext = { outputDir, index: i, safeBaseName, projectRoot };

    const gen = proofGenerators.find((g) => g.supports(f));
    if (!gen) {
      f.proofGeneration = unsupportedResult();
      continue;
    }

    const result = gen.emit(f, ctx);
    if (!result.body.trim()) {
      f.proofGeneration = result.proofGeneration;
      continue;
    }
    const outPath = join(outputDir, `${safeBaseName}.test.mjs`);
    writeFileSync(outPath, result.body, "utf-8");
    written.push(outPath);
    f.generatedTest = outPath;
    f.proofGeneration = {
      ...result.proofGeneration,
      generatedPath: outPath,
      wasGenerated: true,
    };
  }

  return written;
}
