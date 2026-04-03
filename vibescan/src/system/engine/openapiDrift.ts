// OpenAPI 3 / Swagger 2 path inventory vs Express route graph (spec drift, undocumented endpoints).

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import type { Finding, RouteNode } from "../types.js";
import { AUTH_MIDDLEWARE, chainMatchesList } from "../utils/middlewareNames.js";
import { findingRouteFromNode } from "../utils/routeFindingMeta.js";

type TemplateSeg = { kind: "lit"; v: string } | { kind: "par"; name: string };

const HTTP_OPS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

function structureKey(segments: TemplateSeg[]): string {
  return segments
    .map((s) => (s.kind === "lit" ? `L:${JSON.stringify(s.v)}` : "P"))
    .join("/");
}

function expressPathToSegments(fullPath: string): TemplateSeg[] {
  const parts = fullPath.split("/").filter(Boolean);
  return parts.map((p) => {
    if (p.startsWith(":")) return { kind: "par", name: p.slice(1) };
    return { kind: "lit", v: p };
  });
}

function openApiPathToSegments(path: string): TemplateSeg[] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const parts = normalized.split("/").filter(Boolean);
  return parts.map((part) => {
    const m = /^\{([^}]+)\}$/.exec(part);
    if (m) return { kind: "par", name: m[1] ?? "p" };
    return { kind: "lit", v: part };
  });
}

function opKey(method: string, segments: TemplateSeg[]): string {
  return `${method.toUpperCase()}\t${structureKey(segments)}`;
}

export interface SpecOperation {
  method: string;
  pathTemplate: string;
  specFile: string;
  structure: string;
}

/** OpenAPI operation with inferred auth requirement (security / security: []). */
export interface SpecOperationDetail extends SpecOperation {
  requiresAuth: boolean;
  /** Resolved `security` scheme names for this operation. */
  securitySchemeRefs: string[];
  /** Normalized kinds from components.securitySchemes (e.g. bearer, oauth2). */
  schemeKinds: string[];
}

function schemeKindFromSchemeObj(obj: Record<string, unknown>): string {
  const t = obj.type;
  if (t === "http" && String(obj.scheme ?? "").toLowerCase() === "bearer") return "bearer";
  if (t === "http" && String(obj.scheme ?? "").toLowerCase() === "basic") return "basic";
  if (t === "apiKey") return "apiKey";
  if (t === "oauth2") return "oauth2";
  if (t === "openIdConnect") return "openIdConnect";
  if (t === "mutualTLS") return "mutualTLS";
  return "unknown";
}

/** Map security scheme name → normalized kind (OAS3 components + Swagger2 securityDefinitions). */
function buildSecuritySchemeKindIndex(doc: unknown): Map<string, string> {
  const m = new Map<string, string>();
  if (!doc || typeof doc !== "object") return m;
  const root = doc as Record<string, unknown>;
  const comp = root.components as Record<string, unknown> | undefined;
  const schemes = comp?.securitySchemes as Record<string, unknown> | undefined;
  if (schemes && typeof schemes === "object") {
    for (const [name, obj] of Object.entries(schemes)) {
      if (obj && typeof obj === "object") {
        m.set(name, schemeKindFromSchemeObj(obj as Record<string, unknown>));
      }
    }
  }
  const sd = root.securityDefinitions as Record<string, unknown> | undefined;
  if (sd && typeof sd === "object") {
    for (const [name, obj] of Object.entries(sd)) {
      if (obj && typeof obj === "object" && !m.has(name)) {
        m.set(name, schemeKindFromSchemeObj(obj as Record<string, unknown>));
      }
    }
  }
  return m;
}

function securityRefNames(security: unknown): string[] {
  if (!Array.isArray(security)) return [];
  const names: string[] = [];
  for (const item of security) {
    if (item && typeof item === "object") {
      names.push(...Object.keys(item as object));
    }
  }
  return names;
}

function securityRefsForOperation(
  opRec: Record<string, unknown>,
  globalSecurity: unknown
): string[] {
  if (Object.prototype.hasOwnProperty.call(opRec, "security")) {
    return securityRefNames(opRec.security);
  }
  return securityRefNames(globalSecurity);
}

function computeRequiresAuth(
  opObj: Record<string, unknown> | undefined,
  globalSecurity: unknown
): boolean {
  if (opObj && Array.isArray(opObj.security)) {
    if (opObj.security.length === 0) return false;
    return opObj.security.some(
      (item) => item && typeof item === "object" && Object.keys(item as object).length > 0
    );
  }
  if (Array.isArray(globalSecurity)) {
    if (globalSecurity.length === 0) return false;
    return globalSecurity.some(
      (item) => item && typeof item === "object" && Object.keys(item as object).length > 0
    );
  }
  return false;
}

function extractOperationDetailsFromDoc(doc: unknown, specFile: string): SpecOperationDetail[] {
  if (!doc || typeof doc !== "object") return [];
  const o = doc as Record<string, unknown>;
  const paths = o.paths;
  const globalSecurity = o.security;
  const schemeIndex = buildSecuritySchemeKindIndex(doc);
  if (!paths || typeof paths !== "object") return [];
  const out: SpecOperationDetail[] = [];
  for (const [pathTemplate, item] of Object.entries(paths as Record<string, unknown>)) {
    if (!item || typeof item !== "object" || pathTemplate.startsWith("x-")) continue;
    const pathObj = item as Record<string, unknown>;
    for (const [method, op] of Object.entries(pathObj)) {
      if (!HTTP_OPS.has(method.toLowerCase())) continue;
      if (!op || typeof op !== "object") continue;
      const opRec = op as Record<string, unknown>;
      const segs = openApiPathToSegments(pathTemplate);
      const structure = structureKey(segs);
      const requiresAuth = computeRequiresAuth(opRec, globalSecurity);
      const securitySchemeRefs = securityRefsForOperation(opRec, globalSecurity);
      const schemeKinds = [...new Set(securitySchemeRefs.map((r) => schemeIndex.get(r) ?? "unknown"))];
      out.push({
        method: method.toUpperCase(),
        pathTemplate,
        specFile,
        structure,
        requiresAuth,
        securitySchemeRefs,
        schemeKinds,
      });
    }
  }
  return out;
}

export function loadOpenApiOperations(absPath: string): SpecOperation[] {
  return loadOpenApiOperationDetails(absPath);
}

export function loadOpenApiOperationDetails(absPath: string): SpecOperationDetail[] {
  if (!existsSync(absPath)) return [];
  const text = readFileSync(absPath, "utf-8");
  let doc: unknown;
  const lower = absPath.toLowerCase();
  try {
    if (lower.endsWith(".json")) {
      doc = JSON.parse(text) as unknown;
    } else {
      doc = parseYaml(text) as unknown;
    }
  } catch {
    return [];
  }
  if (!doc || typeof doc !== "object") return [];
  const root = doc as Record<string, unknown>;
  if (!root.paths || typeof root.paths !== "object") return [];
  const openapiVer = typeof root.openapi === "string" ? root.openapi : "";
  const isOas3 = openapiVer.startsWith("3");
  const isSwagger2 = root.swagger === "2.0";
  if (!isOas3 && !isSwagger2) return [];
  return extractOperationDetailsFromDoc(doc, absPath);
}

/** Default discovery under project root (non-recursive + one level for common layouts). */
export function discoverOpenApiSpecPaths(projectRoot: string): string[] {
  const root = resolve(projectRoot);
  const found = new Set<string>();
  const patterns = [
    "openapi.{yml,yaml,json}",
    "swagger.{yml,yaml,json}",
    "docs/openapi.{yml,yaml,json}",
    "docs/swagger.{yml,yaml,json}",
    "api/openapi.{yml,yaml,json}",
  ];
  for (const p of patterns) {
    const hits = fg.sync(p, { cwd: root, absolute: true, onlyFiles: true });
    for (const h of hits) found.add(h);
  }
  return [...found].sort();
}

export function resolveOpenApiSpecPaths(
  projectRoot: string | undefined,
  explicit: string[] | undefined,
  discovery: boolean | undefined
): string[] {
  const exp = explicit?.length
    ? explicit.map((p) => resolve(p))
    : [];
  if (exp.length) return [...new Set(exp)];
  if (discovery === false || !projectRoot) return [];
  return discoverOpenApiSpecPaths(projectRoot);
}

function codeOperationKey(route: RouteNode): string {
  const segs = expressPathToSegments(route.fullPath);
  return opKey(route.method, segs);
}

function baseFinding(
  ruleId: string,
  message: string,
  why: string,
  remediation: string,
  filePath: string,
  line: number,
  findingKind: string
): Finding {
  return {
    ruleId,
    message,
    why,
    remediation,
    fix: remediation,
    severity: "warning",
    severityLabel: "MEDIUM",
    category: "api_inventory",
    cwe: 284,
    owasp: "API9:2023",
    findingKind,
    line,
    column: 0,
    filePath,
    source: `${filePath}:${line}`,
  };
}

/**
 * Compare merged Express routes to OpenAPI operations from one or more spec files.
 * Heuristic: dynamic route segments, sub-routers, and non-Express servers may cause false positives.
 */
export function runOpenApiDriftAudit(routes: RouteNode[], specPaths: string[]): Finding[] {
  if (specPaths.length === 0) return [];

  const specByKey = new Map<string, SpecOperationDetail>();
  for (const sp of specPaths) {
    const ops = loadOpenApiOperationDetails(sp);
    for (const op of ops) {
      const key = `${op.method}\t${op.structure}`;
      if (!specByKey.has(key)) specByKey.set(key, op);
    }
  }

  if (specByKey.size === 0) return [];

  const codeByKey = new Map<string, RouteNode>();
  for (const r of routes) {
    const key = codeOperationKey(r);
    if (!codeByKey.has(key)) codeByKey.set(key, r);
  }

  const findings: Finding[] = [];

  for (const [key, route] of codeByKey) {
    if (!specByKey.has(key)) {
      findings.push({
        ...baseFinding(
          "API-INV-001",
          `Express route not documented in OpenAPI: ${route.method} ${route.fullPath}`,
          "Undocumented endpoints expand attack surface and hide authorization gaps (OWASP API9). Clients and gateways may omit them from policy, tests, and review.",
          "Add this operation to the OpenAPI document or remove dead code; ensure authz is documented and enforced.",
          route.file,
          route.line,
          "OPENAPI_UNDOCUMENTED_ROUTE"
        ),
        route: findingRouteFromNode(route),
      });
    }
  }

  for (const [key, specOp] of specByKey) {
    const route = codeByKey.get(key);
    if (route && specOp.requiresAuth && !chainMatchesList(route.middlewares, AUTH_MIDDLEWARE)) {
      const kinds =
        specOp.schemeKinds.length > 0 ? specOp.schemeKinds.join(", ") : "unknown-scheme";
      const refs =
        specOp.securitySchemeRefs.length > 0 ? specOp.securitySchemeRefs.join(", ") : "—";
      findings.push({
        ...baseFinding(
          "API-AUTH-001",
          `OpenAPI requires auth (${kinds}; schemes: ${refs}) for ${specOp.method} ${specOp.pathTemplate}, but static route lacks recognizable auth middleware: ${route.method} ${route.fullPath}`,
          "The published contract marks this operation as secured; if the live handler is public, clients and gateways may misjudge exposure (OWASP API2/API5).",
          "Enforce authentication consistent with the spec, or adjust the OpenAPI security requirements to match reality.",
          route.file,
          route.line,
          "OPENAPI_AUTH_MISMATCH"
        ),
        route: findingRouteFromNode(route),
        openApiSecurity: {
          schemeRefs: specOp.securitySchemeRefs,
          schemeKinds: specOp.schemeKinds,
          specFile: specOp.specFile,
          pathTemplate: specOp.pathTemplate,
        },
      });
    }
  }

  for (const [key, op] of specByKey) {
    if (!codeByKey.has(key)) {
      findings.push(
        baseFinding(
          "API-INV-002",
          `OpenAPI operation has no matching Express route: ${op.method} ${op.pathTemplate}`,
          "The published contract references behavior that is absent from static Express route extraction—possible dead documentation, alternate stack, or graph limitation.",
          "Implement the route, remove the spec entry, or confirm the handler lives outside Express/static analysis scope.",
          op.specFile,
          1,
          "OPENAPI_GHOST_OPERATION"
        )
      );
    }
  }

  return findings;
}
