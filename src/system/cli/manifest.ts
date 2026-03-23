import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function pkgVersion(): string {
  try {
    const p = join(__dirname, "..", "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(p, "utf-8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export interface ManifestInputs {
  argv: string[];
  projectRoot: string;
  includedFiles: string[];
  outputJsonPath?: string;
  outputSarifPath?: string;
  adjudicationJson?: string;
  adjudicationCsv?: string;
  /** Optional deployment/build correlation (CLI --build-id). */
  buildId?: string;
  /** OpenAPI files used when drift analysis ran. */
  openApiSpecsUsed?: string[];
}

export function buildRunManifest(m: ManifestInputs): Record<string, unknown> {
  const outputs: Record<string, string> = {};
  if (m.outputJsonPath) outputs.vibescanProjectJson = m.outputJsonPath;
  if (m.outputSarifPath) outputs.sarif = m.outputSarifPath;
  if (m.adjudicationJson) outputs.adjudicationJson = m.adjudicationJson;
  if (m.adjudicationCsv) outputs.adjudicationCsv = m.adjudicationCsv;

  return {
    benchmarkName: "",
    benchmarkSlug: "",
    sourceRepo: { url: "", originLabel: "", commitHash: "", branchOrTag: "" },
    scannerRepo: { url: "", commitHash: "" },
    toolVersions: {
      node: process.version,
      secureCodeScanner: pkgVersion(),
      vibescanCli: pkgVersion(),
    },
    scope: {
      includedFiles: m.includedFiles,
      excludedFiles: [],
      excludedGlobs: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      projectRoot: m.projectRoot,
      buildId: m.buildId ?? "",
      openApiSpecsUsed: m.openApiSpecsUsed ?? [],
    },
    runDate: { utcIso8601: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    outputs: {
      directory: "",
      artifacts: Object.entries(outputs).map(([key, path]) => ({ path, description: key })),
    },
    cliArgv: m.argv,
    environment: { os: process.platform, shell: process.env.SHELL ?? process.env.ComSpec ?? "" },
    notes: "",
  };
}

export function writeRunManifest(path: string, data: Record<string, unknown>): void {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}
