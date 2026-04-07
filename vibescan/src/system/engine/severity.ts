import type { Severity, SeverityLabel } from "../types.js";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 3,
  error: 2,
  warning: 1,
  info: 0,
};

export const SEVERITY_LABEL: Record<Severity, SeverityLabel> = {
  critical: "CRITICAL",
  error: "HIGH",
  warning: "MEDIUM",
  info: "LOW",
};
