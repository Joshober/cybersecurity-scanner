/**
 * Map external SARIF tool rule ids to VibeScan canonical rule ids (for proof generators).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface SarifRuleMapEntry {
  /** When set, must match SARIF tool driver name (case-sensitive). */
  tool?: string;
  /** External rule id must start with this string. */
  ruleIdPrefix: string;
  /** VibeScan rule id, e.g. crypto.jwt.weak-secret-literal */
  mapToRuleId: string;
}

export interface SarifRuleMapFile {
  version: 1;
  mappings: SarifRuleMapEntry[];
}

export function loadSarifRuleMapFile(absPath: string): SarifRuleMapEntry[] {
  if (!existsSync(absPath)) return [];
  const raw = readFileSync(absPath, "utf-8");
  const doc = JSON.parse(raw) as SarifRuleMapFile;
  if (!doc || doc.version !== 1 || !Array.isArray(doc.mappings)) return [];
  return doc.mappings.filter(
    (m) =>
      m &&
      typeof m.ruleIdPrefix === "string" &&
      typeof m.mapToRuleId === "string" &&
      m.ruleIdPrefix.length > 0
  );
}

export function mapExternalRuleId(
  toolName: string,
  externalRuleId: string,
  entries: SarifRuleMapEntry[]
): string | undefined {
  for (const e of entries) {
    if (e.tool && e.tool !== toolName) continue;
    if (externalRuleId.startsWith(e.ruleIdPrefix)) return e.mapToRuleId;
  }
  return undefined;
}

export function resolveRuleMapPath(projectRoot: string, explicit?: string): string | undefined {
  if (explicit) return resolve(explicit);
  const def = resolve(projectRoot, "vibescan-sarif-rule-map.json");
  return existsSync(def) ? def : undefined;
}
