#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import ora from "ora";
import { scanDirectory } from "./scan.js";
import { listRulesMeta } from "./rules/index.js";
import { formatHuman, formatJson, hasCritical } from "./reporter/report.js";
import { generateTests } from "./generator/testWriter.js";
import { checkDependencies } from "./slopsquat/registryChecker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, "..", "package.json");
let cliVersion = "0.1.0";
try {
  cliVersion = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version ?? cliVersion;
} catch {
  /* keep default */
}

const program = new Command();

program.name("vibescan").description("Static security scanner for Express-style Node apps").version(cliVersion);

program
  .command("scan")
  .argument("<dir>", "directory to scan")
  .option("--json", "machine-readable JSON output")
  .option("--generate-tests", "emit Jest test stubs into output dir")
  .option("--tests-dir <path>", "directory for generated tests", "./vibescan-generated-tests")
  .option("--check-registry", "run slopsquat npm registry checks")
  .option("--skip-registry", "skip registry checks when used with --check-registry")
  .option("--package-json <path>", "package.json for registry check", "./package.json")
  .option("--llm", "reserved: future LLM-assisted review (no-op)")
  .action(async (dir, opts) => {
    if (opts.llm) {
      /* future: Phi-4-mini design review */
    }
    const spinner = ora("Scanning…").start();
    const absDir = path.resolve(dir);
    const { ctx, findings: initialFindings } = scanDirectory(absDir);
    /** @type {import('./types.js').Finding[]} */
    let findings = [...initialFindings];
    spinner.succeed(`Scanned ${ctx.files.length} files, ${ctx.routes.length} routes`);

    if (opts.checkRegistry && !opts.skipRegistry) {
      const pj = path.resolve(opts.packageJson);
      const reg = await checkDependencies(pj);
      for (const r of reg) {
        findings.push({
          ruleId: r.ruleId,
          message: r.message,
          cwe: r.cwe,
          owasp: r.owasp,
          severity: r.severity,
          file: pj,
          line: 0,
          snippet: r.packageName,
        });
      }
    }

    if (opts.json) {
      process.stdout.write(formatJson(findings) + "\n");
    } else {
      process.stdout.write(formatHuman(findings) + "\n");
    }

    if (opts.generateTests) {
      const outDir = path.resolve(opts.testsDir);
      await generateTests(findings, outDir);
      process.stdout.write(`\nGenerated tests under ${outDir}\n`);
    }

    if (hasCritical(findings)) {
      process.exitCode = 1;
    }
  });

program
  .command("rules")
  .description("list rule IDs and metadata")
  .action(() => {
    const meta = listRulesMeta();
    for (const m of meta) {
      process.stdout.write(`${m.id}\t${m.severity}\t${m.cwe ?? ""}\t${m.owasp ?? ""}\n`);
    }
  });

await program.parseAsync(process.argv);
