#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

function pct(hit, total) {
  if (!total) return "0.0%";
  return `${((hit / total) * 100).toFixed(1)}%`;
}

function main() {
  const matrix = JSON.parse(readFileSync(join(repoRoot, "results", "dvna-detection-matrix.json"), "utf8"));
  const dvnaCatalog = JSON.parse(readFileSync(join(repoRoot, "results", "dvna-case-catalog.json"), "utf8"));
  const frameworkCatalog = JSON.parse(readFileSync(join(repoRoot, "results", "framework-vuln-case-catalog.json"), "utf8"));
  const frameworkHighVolumeCatalog = JSON.parse(
    readFileSync(join(repoRoot, "results", "framework-vuln-case-catalog-high-volume.json"), "utf8")
  );
  const frameworkRun = JSON.parse(
    readFileSync(
      join(repoRoot, "benchmarks", "results", "ci_framework_vulns_vibescan", "vibescan-project.json"),
      "utf8"
    )
  );

  const dvnaIds = (dvnaCatalog.cases || []).map((c) => c.id);
  const rows = [];
  for (const tool of matrix.tools || []) {
    if (tool.chartMode === "gap") continue;
    const hit = dvnaIds.filter((id) => tool.detections?.[id] === true).length;
    rows.push({ tool: tool.label, corpus: "DVNA (11 rows)", hit, total: dvnaIds.length });
  }

  const findings = Array.isArray(frameworkRun.findings) ? frameworkRun.findings : [];
  const frCases = [...(frameworkCatalog.cases || []), ...(frameworkHighVolumeCatalog.cases || [])];
  const frameworkHits = frCases.filter((c) =>
    findings.some(
      (f) =>
        String(f.filePath || "")
          .replace(/\\/g, "/")
          .toLowerCase()
          .endsWith(String(c.anchorSuffix || "").toLowerCase()) &&
        (c.anchorLines || []).includes(Number(f.line)) &&
        (c.expectedRuleIds || []).includes(f.ruleId)
    )
  ).length;
  rows.unshift({
    tool: "VibeScan",
    corpus: `Expanded framework corpus (${frCases.length} rows)`,
    hit: frameworkHits,
    total: frCases.length,
  });

  const md = [
    "# Recall Outperform Readout",
    "",
    "Canonical recall readout generated from committed benchmark artifacts.",
    "",
    "| Tool | Corpus | Recall |",
    "|---|---|---|",
    ...rows.map((r) => `| ${r.tool} | ${r.corpus} | ${r.hit}/${r.total} (${pct(r.hit, r.total)}) |`),
    "",
    "## Notes",
    "- DVNA values come from `results/dvna-detection-matrix.json`.",
    "- Expanded corpus value comes from `results/framework-vuln-case-catalog.json` + `results/framework-vuln-case-catalog-high-volume.json` + `benchmarks/results/ci_framework_vulns_vibescan/vibescan-project.json`.",
    "- Scope caveat: this compares benchmarked SAST rows, not SCA/CVE coverage.",
    "",
  ].join("\n");

  const outPath = join(repoRoot, "results", "outperform-readout.md");
  writeFileSync(outPath, md, "utf8");
  console.log(`Wrote ${outPath}`);
}

main();
