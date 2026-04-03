/**
 * Proof failure taxonomy: codes align with `ProofFailureCode` in types.ts.
 */

import type { ProofFailureCode } from "../types.js";

export const PROOF_FAILURE_CODES: readonly ProofFailureCode[] = [
  "unknown",
  "unresolved_dynamic_dispatch",
  "unresolved_import",
  "runtime_route_registration",
  "external_dependency_required",
  "missing_auth_context",
  "environment_secret_required",
  "dynamic_url_unresolved",
] as const;

export function isProofFailureCode(s: string): s is ProofFailureCode {
  return (PROOF_FAILURE_CODES as readonly string[]).includes(s);
}

/** Short labels for JSON / SARIF consumers. */
export const PROOF_FAILURE_CODE_DESCRIPTIONS: Record<ProofFailureCode, string> = {
  unknown: "Proof limitation not further classified.",
  unresolved_dynamic_dispatch: "Callee or property access could not be resolved statically.",
  unresolved_import: "Module or symbol import could not be resolved for proof harness.",
  runtime_route_registration: "Route or handler is registered only at runtime; static graph incomplete.",
  external_dependency_required: "Validation depends on packages or binaries not bundled in the proof.",
  missing_auth_context: "Session, user, or auth context is required to exercise the path.",
  environment_secret_required: "A secret or key from the environment is required to complete proof.",
  dynamic_url_unresolved: "URL or host for SSRF/request sink could not be resolved statically.",
};
