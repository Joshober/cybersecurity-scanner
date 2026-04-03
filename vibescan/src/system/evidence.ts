/**
 * Evidence-oriented fields for JSON output: stable finding IDs, proof coverage,
 * confidence explanations, and lightweight root-cause / fix-preview structures.
 */

import { createHash } from "node:crypto";
import type { Finding, ProofGeneration, ProofTierLabel } from "./types.js";
import { getRuleDocumentation } from "./ruleCatalog.js";

/** Stable id for `vibescan reproduce` and dashboards (content-derived). */
export function computeFindingId(f: Finding): string {
  const payload = JSON.stringify({
    ruleId: f.ruleId,
    file: f.filePath ?? "",
    line: f.line,
    column: f.column ?? 0,
    message: f.message,
  });
  return `vs1-${createHash("sha256").update(payload).digest("hex").slice(0, 16)}`;
}

/**
 * Tier model (research / poster):
 * 1 = fully deterministic local proof
 * 2 = partial proof / needs manual completion
 * 3 = structural evidence (route/graph) without a generated test file
 * 4 = detection only
 */
export function proofCoverageTier(f: Finding): 1 | 2 | 3 | 4 {
  const pg = f.proofGeneration;
  if (!pg) return 4;
  if (pg.status === "provable_locally" && pg.wasGenerated) return 1;
  if (pg.status === "needs_manual_completion") return 2;
  if (pg.status === "unsupported") {
    if (
      f.route &&
      (f.ruleId.startsWith("AUTH-") ||
        f.ruleId.startsWith("MW-") ||
        f.ruleId.startsWith("API-") ||
        f.ruleId.startsWith("WEBHOOK-"))
    ) {
      return 3;
    }
    return 4;
  }
  if (pg.status === "provable_locally" && !pg.wasGenerated) return 2;
  return 4;
}

/** Map numeric tier to roadmap string label. */
export function proofTierLabelFromNumber(t: 1 | 2 | 3 | 4): ProofTierLabel {
  if (t === 1) return "provable";
  if (t === 2) return "partial";
  if (t === 3) return "structural";
  return "detection_only";
}

/** Per-finding proof metrics for JSON (deterministic flags are heuristics unless set by generators). */
export interface ProofMetrics {
  proofTierLabel: ProofTierLabel;
  proofTier: 1 | 2 | 3 | 4;
  deterministic: boolean;
  requiresNetwork: boolean;
  requiresSecrets: boolean;
  requiresEnv: boolean;
  requiresManualCompletion: boolean;
  proofReason: string;
}

function inferDeterministic(_f: Finding, tier: 1 | 2 | 3 | 4, pg: ProofGeneration | undefined): boolean {
  if (!pg) return false;
  if (pg.deterministic !== undefined) return pg.deterministic;
  if (tier === 1 && pg.wasGenerated && pg.status === "provable_locally") return true;
  return false;
}

function inferRequiresNetwork(pg: ProofGeneration | undefined): boolean {
  return pg?.requiresNetwork === true;
}

function inferRequiresSecrets(pg: ProofGeneration | undefined): boolean {
  return pg?.requiresSecrets === true;
}

function inferRequiresEnv(pg: ProofGeneration | undefined): boolean {
  return pg?.requiresEnv === true;
}

function buildProofReason(_f: Finding, tier: 1 | 2 | 3 | 4, _label: ProofTierLabel, pg: ProofGeneration | undefined): string {
  if (!pg) return "No proof pipeline output for this finding (detection-only).";
  if (tier === 1 && pg.wasGenerated) {
    return "Local proof test was generated; runnable with node --test without network by default.";
  }
  if (tier === 2) {
    return pg.failureReason ?? "Proof template exists but needs manual steps or data to complete.";
  }
  if (tier === 3) {
    return "Route or API structure evidence present; no full proof file for this rule family.";
  }
  return pg.failureReason ?? "No proof-oriented generator for this rule or insufficient static context.";
}

export function proofMetricsForFinding(f: Finding): ProofMetrics {
  const tier = proofCoverageTier(f);
  const label = proofTierLabelFromNumber(tier);
  const pg = f.proofGeneration;
  const requiresManualCompletion =
    pg?.status === "needs_manual_completion" || (pg?.manualNeeded?.length ?? 0) > 0;

  return {
    proofTierLabel: label,
    proofTier: tier,
    deterministic: inferDeterministic(f, tier, pg),
    requiresNetwork: inferRequiresNetwork(pg),
    requiresSecrets: inferRequiresSecrets(pg),
    requiresEnv: inferRequiresEnv(pg),
    requiresManualCompletion,
    proofReason: buildProofReason(f, tier, label, pg),
  };
}

export interface ProofCoverageSummary {
  total_findings: number;
  /** Share of findings with tier 1 (fully local proof emitted). */
  provable: number;
  /** Tier 2 — partial or manual completion. */
  partial: number;
  /** Tier 3 — structural / route-level evidence without full proof file. */
  structural: number;
  /** Tier 4 — detection only. */
  detection_only: number;
  /** Percent of findings with tier 1 local proof (0–100). */
  proof_coverage_percent: number;
  /**
   * Among findings with a generated proof artifact (wasGenerated), percentage where deterministic is true.
   * 0 when no generated proofs. Heuristic unless generators set flags.
   */
  deterministic_proof_percent: number;
  by_tier: { tier_1: number; tier_2: number; tier_3: number; tier_4: number };
  /** True when no finding ran the proof pipeline (no proofGeneration on any finding). */
  proof_pipeline_not_run: boolean;
}

export function summarizeProofCoverage(findings: Finding[]): ProofCoverageSummary {
  let provable = 0;
  let partial = 0;
  let structural = 0;
  let detectionOnly = 0;
  const byTier = { tier_1: 0, tier_2: 0, tier_3: 0, tier_4: 0 };
  let anyProof = false;
  let generatedCount = 0;
  let deterministicGenerated = 0;

  for (const f of findings) {
    if (f.proofGeneration) anyProof = true;
    const t = proofCoverageTier(f);
    const m = proofMetricsForFinding(f);
    byTier[`tier_${t}` as keyof typeof byTier]++;
    if (t === 1) provable++;
    else if (t === 2) partial++;
    else if (t === 3) structural++;
    else detectionOnly++;

    if (f.proofGeneration?.wasGenerated) {
      generatedCount++;
      if (m.deterministic) deterministicGenerated++;
    }
  }

  const n = findings.length || 1;
  const proof_coverage_percent = Math.round((provable / n) * 1000) / 10;
  const deterministic_proof_percent =
    generatedCount === 0 ? 0 : Math.round((deterministicGenerated / generatedCount) * 1000) / 10;

  return {
    total_findings: findings.length,
    provable,
    partial,
    structural,
    detection_only: detectionOnly,
    proof_coverage_percent,
    deterministic_proof_percent,
    by_tier: byTier,
    proof_pipeline_not_run: findings.length > 0 && !anyProof,
  };
}

/** Human-readable basis for numeric confidence (evidence-first wording). */
export function confidenceReasonForFinding(f: Finding): string {
  const reasons = confidenceReasonsForFinding(f);
  return reasons.join(" ");
}

/** Explicit bullet reasons for confidence (research / JSON). */
export function confidenceReasonsForFinding(f: Finding): string[] {
  const out: string[] = [];
  if (f.sourceLabel && f.sinkLabel) {
    out.push(`Static taint path: ${f.sourceLabel} → ${f.sinkLabel}.`);
  } else if (f.sourceLabel) {
    out.push(`Source signal: ${f.sourceLabel}.`);
  } else if (f.sinkLabel) {
    out.push(`Sink signal: ${f.sinkLabel}.`);
  }
  if (f.route) {
    out.push(`Route ${f.route.method} ${f.route.fullPath} extracted from application graph.`);
    if (f.route.middlewares?.length) {
      out.push(`Middleware chain (order preserved): ${f.route.middlewares.join(", ")}.`);
    } else {
      out.push("No recognizable middleware chain matched for this route.");
    }
  }
  if (f.findingKind === "SLOPSQUAT_CANDIDATE" || f.ruleId === "SLOP-001") {
    out.push("Registry check: package name did not resolve on the public npm registry.");
  }
  const m = proofMetricsForFinding(f);
  if (m.proofTierLabel === "provable") {
    out.push("Local proof tier: provable (generated test).");
  } else if (m.proofTierLabel === "partial") {
    out.push("Local proof tier: partial — manual completion may be required.");
  } else if (m.proofTierLabel === "structural") {
    out.push("Structural evidence (route/API) without full executable proof.");
  }
  if (out.length === 0) {
    const doc = getRuleDocumentation(f.ruleId);
    out.push(`Pattern rule ${f.ruleId}: ${doc.pattern.slice(0, 200)}${doc.pattern.length > 200 ? "…" : ""}`);
  }
  return out;
}

export interface RootCauseGraph {
  kind: "taint" | "route" | "pattern";
  /** Ordered steps (sources, sinks, route segments). */
  path: string[];
  /** Gaps or missing controls (e.g. sanitization, auth). */
  missing?: string[];
}

/** Versioned causal graph for HTML/JSON (optional richer than RootCauseGraph). */
export interface RootCauseGraphV2 {
  version: 1;
  kind: "taint" | "route" | "pattern";
  nodes: { id: string; label: string; role: "source" | "transform" | "sink" | "route" | "pattern" }[];
  edges: { from: string; to: string; label?: string }[];
  missingControls: string[];
}

export function rootCauseGraphForFinding(f: Finding): RootCauseGraph {
  if (f.sourceLabel || f.sinkLabel) {
    const path = [f.sourceLabel, f.sinkLabel].filter((s): s is string => !!s && s.length > 0);
    const missing: string[] = [];
    if (f.sourceLabel && f.sinkLabel) missing.push("validated sanitization / parameterization before sink");
    return {
      kind: "taint",
      path: path.length ? path : [f.message],
      missing: missing.length ? missing : undefined,
    };
  }
  if (f.route) {
    const path = [`${f.route.method} ${f.route.fullPath}`, ...f.route.middlewares.map((m) => `mw:${m}`)];
    const missing: string[] = [];
    if (f.ruleId.startsWith("AUTH-") || f.ruleId === "API-POSTURE-001") missing.push("recognizable auth middleware on this route");
    if (f.ruleId === "MW-001") missing.push("CSRF protection on state-changing handler");
    return { kind: "route", path, missing: missing.length ? missing : undefined };
  }
  const file = f.filePath ?? "(file)";
  return {
    kind: "pattern",
    path: [`${file}:${f.line}`, f.ruleId],
  };
}

export function rootCauseGraphV2ForFinding(f: Finding): RootCauseGraphV2 {
  const legacy = rootCauseGraphForFinding(f);
  const missingControls = legacy.missing ?? [];
  if (legacy.kind === "taint") {
    const nodes: RootCauseGraphV2["nodes"] = [];
    const edges: RootCauseGraphV2["edges"] = [];
    if (f.sourceLabel) {
      nodes.push({ id: "n0", label: f.sourceLabel, role: "source" });
    }
    if (f.sourceLabel && f.sinkLabel) {
      nodes.push({ id: "n1", label: f.sinkLabel, role: "sink" });
      edges.push({ from: "n0", to: "n1", label: "data flow" });
    } else if (f.sinkLabel) {
      nodes.push({ id: "n0", label: f.sinkLabel, role: "sink" });
    }
    if (nodes.length === 0) {
      nodes.push({ id: "n0", label: f.message, role: "pattern" });
    }
    return { version: 1, kind: "taint", nodes, edges, missingControls };
  }
  if (legacy.kind === "route" && f.route) {
    const nodes: RootCauseGraphV2["nodes"] = [
      { id: "route", label: `${f.route.method} ${f.route.fullPath}`, role: "route" },
    ];
    const edges: RootCauseGraphV2["edges"] = [];
    let prev = "route";
    f.route.middlewares.forEach((m, i) => {
      const id = `mw${i}`;
      nodes.push({ id, label: m, role: "transform" });
      edges.push({ from: prev, to: id, label: "middleware" });
      prev = id;
    });
    return { version: 1, kind: "route", nodes, edges, missingControls };
  }
  const file = f.filePath ?? "(file)";
  return {
    version: 1,
    kind: "pattern",
    nodes: [
      { id: "loc", label: `${file}:${f.line}`, role: "pattern" },
      { id: "rule", label: f.ruleId, role: "pattern" },
    ],
    edges: [{ from: "loc", to: "rule", label: "matched" }],
    missingControls,
  };
}

export interface FixPreview {
  remediation_hint: string;
  /** Expected effect if the fix is applied and the project re-scanned / proofs re-run. */
  expected_effect: string;
}

export function fixPreviewForFinding(f: Finding): FixPreview | undefined {
  const hint = (f.remediation ?? f.fix)?.trim();
  if (!hint) return undefined;
  const short = hint.length > 280 ? `${hint.slice(0, 280)}…` : hint;
  let expected_effect =
    "Re-scan should clear the pattern if the vulnerability class is fully addressed; confirm with review.";
  if (f.proofGeneration?.status === "provable_locally") {
    expected_effect =
      "After the fix, re-run `vibescan prove` / `vibescan reproduce <id>` — local proof tests should no longer demonstrate the issue.";
  } else if (f.proofGeneration?.status === "needs_manual_completion") {
    expected_effect =
      "Complete manual proof steps noted in proofGeneration, then re-scan; structural issues may require runtime tests.";
  }
  return { remediation_hint: short, expected_effect };
}

/** Merge structured failure reason for JSON (proof pipeline). */
export function attachProofFailureReason(pg: ProofGeneration): ProofGeneration {
  if (pg.status === "unsupported" && !pg.failureReason) {
    return {
      ...pg,
      failureCode: pg.failureCode ?? "unknown",
      failureReason: pg.notes ?? "No proof-oriented generator for this rule family or insufficient static context.",
    };
  }
  if (pg.status === "needs_manual_completion" && !pg.failureReason) {
    return {
      ...pg,
      failureCode: pg.failureCode ?? "unknown",
      failureReason: pg.notes ?? "Proof requires manual completion (see manualNeeded / notes).",
    };
  }
  if (pg.failureCode === undefined && (pg.status === "unsupported" || pg.status === "needs_manual_completion")) {
    return { ...pg, failureCode: "unknown" };
  }
  return pg;
}
