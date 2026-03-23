import type { Severity } from "../types.js";
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
  [key: string]: unknown;
}

export interface RuleContext {
  report(node: Node, options?: ReportOptions): void;
  getSource(node: Node): string | undefined;
  /** ESTree parent; set by the rule engine for rules that need ancestor context. */
  getParent(node: Node): Node | null;
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
