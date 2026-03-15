import type { Severity } from "../types.js";
import type { Node } from "estree";

export interface ReportOptions {
  message?: string;
  why?: string;
  fix?: string;
  [key: string]: unknown;
}

export interface RuleContext {
  report(node: Node, options?: ReportOptions): void;
  getSource(node: Node): string | undefined;
}

export interface Rule {
  id: string;
  message: string;
  // Default explanation (can use {{placeholders}}).
  why?: string;
  // Default fix guidance (can use {{placeholders}}).
  fix?: string;
  severity: Severity;
  category: "crypto" | "injection";
  nodeTypes: string[];
  check(context: RuleContext, node: Node): void;
}
