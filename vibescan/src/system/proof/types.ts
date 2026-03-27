import type { Finding, ProofGeneration } from "../types.js";

export interface ProofGenContext {
  outputDir: string;
  index: number;
  /** Safe basename without extension, e.g. crypto_jwt_weak-secret-literal_0 */
  safeBaseName: string;
  projectRoot?: string;
}

export interface ProofEmitResult {
  body: string;
  proofGeneration: ProofGeneration;
}

/** One proof-oriented generator module. */
export interface ProofGenerator {
  readonly id: string;
  supports(f: Finding): boolean;
  emit(f: Finding, ctx: ProofGenContext): ProofEmitResult;
}
