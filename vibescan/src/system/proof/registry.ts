import type { ProofGenerator } from "./types.js";
import { bolaIdorRouteFlowGenerator } from "./generators/bolaIdorRouteFlow.js";
import { jwtWeakSecretGenerator } from "./generators/jwtWeakSecret.js";
import { missingAuthMiddlewareGenerator } from "./generators/missingAuthMiddleware.js";
import { prototypePollutionGenerator } from "./generators/prototypePollution.js";
import { ssrfTaintFlowGenerator } from "./generators/ssrfTaintFlow.js";
import { openApiRouteContractGenerator } from "./generators/openApiRouteContract.js";
import { injectionTaintFlowGenerator } from "./generators/injectionTaintFlow.js";
import { commonStaticPatternProofGenerator } from "./generators/commonStaticPatternProof.js";

/** First matching generator wins (order matters for overlapping rule families). */
export const proofGenerators: ProofGenerator[] = [
  openApiRouteContractGenerator,
  jwtWeakSecretGenerator,
  prototypePollutionGenerator,
  ssrfTaintFlowGenerator,
  bolaIdorRouteFlowGenerator,
  injectionTaintFlowGenerator,
  commonStaticPatternProofGenerator,
  missingAuthMiddlewareGenerator,
];
