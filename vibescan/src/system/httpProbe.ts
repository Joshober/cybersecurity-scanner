// Optional shallow HTTP GET probes — reachability / status only, not DAST or session testing.

import type { Finding, RouteNode } from "./types.js";

const RULE_OK = "probe.http.response";
const RULE_FAIL = "probe.http.error";

function normalizeBaseUrl(base: string): string {
  const b = base.trim().replace(/\/+$/, "");
  return b || "http://localhost";
}

/** Replace Express-style :param segments for a best-effort GET URL. */
export function expressPathToProbePath(routePath: string): string {
  return routePath.replace(/:([^/]+)/g, "1");
}

function dedupeRoutes(routes: RouteNode[]): RouteNode[] {
  const seen = new Set<string>();
  const out: RouteNode[] = [];
  const sorted = [...routes].sort((a, b) => {
    if (a.method !== b.method) return a.method.localeCompare(b.method);
    return a.fullPath.localeCompare(b.fullPath);
  });
  for (const r of sorted) {
    const k = `${r.method}:${r.fullPath}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export interface HttpProbeOptions {
  maxRoutes?: number;
  timeoutMs?: number;
  /** Override fetch (tests). */
  fetchImpl?: typeof fetch;
}

/**
 * GET a subset of discovered Express routes against a running base URL.
 * Findings are informational / warning only by default (shallow smoke test).
 */
export async function probeHttpRoutes(
  baseUrl: string,
  routes: RouteNode[],
  opts: HttpProbeOptions = {}
): Promise<Finding[]> {
  const max = Math.max(1, Math.min(opts.maxRoutes ?? 12, 40));
  const timeoutMs = opts.timeoutMs ?? 8000;
  const fetchFn = opts.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== "function") {
    return [
      {
        ruleId: RULE_FAIL,
        message: "HTTP probe skipped: global fetch is not available in this runtime.",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "api_inventory",
        line: 1,
        column: 1,
        filePath: undefined,
        remediation: "Use Node 18+ or disable --http-probe-url.",
      },
    ];
  }

  const base = normalizeBaseUrl(baseUrl);
  const uniq = dedupeRoutes(routes);
  const getRoutes = uniq.filter((r) => r.method === "GET");
  const take = getRoutes.length > 0 ? getRoutes.slice(0, max) : uniq.slice(0, max);

  const findings: Finding[] = [];

  for (let i = 0; i < take.length; i++) {
    const r = take[i]!;
    const path = expressPathToProbePath(r.fullPath || r.path || "/");
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const started = Date.now();
    try {
      const ac = new AbortController();
      const tid = setTimeout(() => ac.abort(), timeoutMs);
      let res: Awaited<ReturnType<typeof fetchFn>>;
      try {
        res = await fetchFn(url, {
          method: "GET",
          redirect: "manual",
          signal: ac.signal,
        });
      } finally {
        clearTimeout(tid);
      }
      const ms = Date.now() - started;
      const sev = res.status >= 500 ? "warning" : "info";
      const label = sev === "warning" ? "MEDIUM" : "LOW";
      findings.push({
        ruleId: RULE_OK,
        message: `HTTP probe GET ${url} → ${res.status} (${ms}ms)`,
        why: "Observed response status from a live request; does not validate authn/authz or session behavior.",
        remediation:
          "Treat as a shallow smoke signal only. Use dedicated DAST/fuzzing and authenticated flow tests for real coverage.",
        severity: sev,
        severityLabel: label,
        category: "api_inventory",
        line: r.line,
        column: 1,
        filePath: r.file,
      });
    } catch (e) {
      const err = e as Error;
      const msg = err?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : (err?.message ?? String(e));
      findings.push({
        ruleId: RULE_FAIL,
        message: `HTTP probe failed GET ${url}: ${msg}`,
        why: "The server may be down, the URL may be wrong, or the path may be invalid for probing.",
        remediation: "Confirm --http-probe-url and that the app is running; adjust --http-probe-max-routes if needed.",
        severity: "warning",
        severityLabel: "MEDIUM",
        category: "api_inventory",
        line: r.line,
        column: 1,
        filePath: r.file,
      });
    }
  }

  return findings;
}
