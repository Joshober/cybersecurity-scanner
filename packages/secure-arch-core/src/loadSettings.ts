import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { buildFacts } from "./facts.js";
import { validateSettingsDocument, type RawSettingsDoc } from "./schema.js";
import type { ArchitectureFacts } from "./types.js";

const GLOBAL_NAMES = new Set(["settings.global.yaml", "settings.global.yml"]);

function parseYamlFile(path: string): unknown {
  const text = readFileSync(path, "utf-8");
  return YAML.parse(text);
}

function envNameFromFilename(file: string): string | null {
  const m = /^settings\.([a-z0-9_-]+)\.(yaml|yml)$/i.exec(file);
  if (!m) return null;
  if (m[1].toLowerCase() === "global") return null;
  return m[1];
}

export interface LoadResult {
  facts: ArchitectureFacts;
  schemaErrors: { file: string; errors: import("./schema.js").SchemaError[] }[];
  loadedFiles: string[];
}

/**
 * Load architecture/secure-rules/*.yaml and produce merged ArchitectureFacts.
 */
export function loadArchitectureSettings(settingsDir: string): LoadResult {
  const schemaErrors: LoadResult["schemaErrors"] = [];
  const loadedFiles: string[] = [];

  if (!existsSync(settingsDir)) {
    throw new Error(`Settings directory not found: ${settingsDir}`);
  }

  const files = readdirSync(settingsDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  let globalDoc: RawSettingsDoc = {
    schemaVersion: "1",
    project: { name: "unknown" },
    environments: {},
  };

  const globalPath = files.find((f) => GLOBAL_NAMES.has(f.toLowerCase()));
  if (globalPath) {
    const raw = parseYamlFile(join(settingsDir, globalPath));
    loadedFiles.push(globalPath);
    const errs = validateSettingsDocument(raw, globalPath);
    if (errs.length) schemaErrors.push({ file: globalPath, errors: errs });
    if (raw && typeof raw === "object" && raw !== null) {
      globalDoc = { ...globalDoc, ...(raw as RawSettingsDoc) };
    }
  }

  const perEnv = new Map<string, RawSettingsDoc>();
  for (const file of files) {
    if (GLOBAL_NAMES.has(file.toLowerCase())) continue;
    const envName = envNameFromFilename(file);
    if (!envName) continue;
    const raw = parseYamlFile(join(settingsDir, file));
    loadedFiles.push(file);
    const errs = validateSettingsDocument(raw, file);
    if (errs.length) schemaErrors.push({ file, errors: errs });
    if (raw && typeof raw === "object" && raw !== null) {
      const doc = raw as RawSettingsDoc;
      const envs = doc.environments;
      if (envs && typeof envs === "object" && !Array.isArray(envs) && envName in envs) {
        perEnv.set(envName, { environments: { [envName]: (envs as Record<string, unknown>)[envName] } } as RawSettingsDoc);
      } else if (envs && typeof envs === "object" && !Array.isArray(envs)) {
        perEnv.set(envName, doc);
      } else {
        perEnv.set(envName, doc);
      }
    }
  }

  if (perEnv.size === 0) {
    const envs = (globalDoc.environments ?? {}) as Record<string, unknown>;
    for (const name of Object.keys(envs)) {
      perEnv.set(name, { environments: { [name]: envs[name] } } as RawSettingsDoc);
    }
  }

  if (perEnv.size === 0) {
    perEnv.set("default", {});
  }

  const schemaVersion = typeof globalDoc.schemaVersion === "string" ? globalDoc.schemaVersion : "1";
  const projectName =
    globalDoc.project && typeof globalDoc.project === "object" && globalDoc.project !== null && "name" in globalDoc.project
      ? String((globalDoc.project as { name?: unknown }).name ?? "unknown")
      : "unknown";

  const facts = buildFacts(schemaVersion, projectName, globalDoc, perEnv);

  return { facts, schemaErrors, loadedFiles };
}
