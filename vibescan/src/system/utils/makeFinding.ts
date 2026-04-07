import type { Finding, FindingRouteRef, Severity, Category, RouteNode } from "../types.js";
import { SEVERITY_LABEL } from "../engine/severity.js";

export interface FindingInput {
  ruleId: string;
  message: string;
  why?: string;
  remediation?: string;
  fix?: string;
  cwe?: number;
  owasp?: string;
  severity: Severity;
  category: Category;
  findingKind?: string;
  line: number;
  column?: number;
  filePath?: string;
  source?: string;
  route?: FindingRouteRef;
}

/** Build a `Finding` with `severityLabel` derived automatically from `severity`. */
export function makeFinding(input: FindingInput): Finding {
  return {
    ...input,
    severityLabel: SEVERITY_LABEL[input.severity],
    column: input.column ?? 0,
  };
}

/** Convenience: build a finding attached to a route node. */
export function makeRouteFinding(
  input: Omit<FindingInput, "line" | "column" | "filePath" | "source" | "route">,
  route: RouteNode,
): Finding {
  return makeFinding({
    ...input,
    line: route.line,
    column: 0,
    filePath: route.file,
    source: `${route.file}:${route.line}`,
    route: { method: route.method, path: route.path, fullPath: route.fullPath, middlewares: [...route.middlewares] },
  });
}
