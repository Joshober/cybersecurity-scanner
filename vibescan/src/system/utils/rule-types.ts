import type { ProofHints, Severity } from "../types.js";
import type { Node } from "estree";

export interface ReportOptions {
  message?: string;
  why?: string;
  fix?: string;
  remediation?: string;
  cwe?: number;
  owasp?: string;
  cveRef?: string[];
  findingKind?: string;
  generatedTest?: string;
  proofHints?: ProofHints;
  [key: string]: unknown;
}

export interface RuleContext {
  report(node: Node, options?: ReportOptions): void;
  getSource(node: Node): string | undefined;
  /** ESTree parent; set by the rule engine for rules that need ancestor context. */
  getParent(node: Node): Node | null;
  /** Semantic call resolution when TypeScript parser services are available. */
  getResolvedCallee?(node: Node): { calleeName: string | null; importSource?: string; symbolName?: string } | null;
  /** TypeScript-inferred type text when semantic analysis is active. */
  getTypeText?(node: Node): string | undefined;
}

export interface Rule {
  id: string;
  message: string;
  why?: string;
  fix?: string;
  remediation?: string;
  cwe?: number;
  owasp?: string;
  severity: Severity;
  category: "crypto" | "injection";
  nodeTypes: string[];
  check(context: RuleContext, node: Node): void;
}
