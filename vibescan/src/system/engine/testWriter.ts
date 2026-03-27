// Proof-oriented local test generation from static findings (no API / base URL).

import type { Finding } from "../types.js";
import { emitProofTests, type EmitProofTestsOptions } from "../proof/pipeline.js";

/** @deprecated Prefer {@link EmitProofTestsOptions} — same shape. */
export type GenerateTestsOptions = EmitProofTestsOptions;

/**
 * Emit deterministic local proof-oriented tests for supported findings.
 * Sets `finding.proofGeneration` and `finding.generatedTest` when applicable.
 */
export function generateTests(
  findings: Finding[],
  outputDir: string,
  options?: GenerateTestsOptions
): string[] {
  return emitProofTests(findings, outputDir, options);
}
