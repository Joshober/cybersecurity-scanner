import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const cliEntrypoint = resolve("dist/system/cli/index.js");
const fixtureDir = resolve("tests/fixtures/crypto-safe");
const outputDir = mkdtempSync(join(tmpdir(), "vibescan-fixture-"));
const formats = ["json", "sarif"];

for (const format of formats) {
  const outputPath = join(outputDir, `fixture-scan.${format}`);
  const result = execFileSync(
    process.execPath,
    [cliEntrypoint, "scan", fixtureDir, "--format", format],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
  );

  writeFileSync(outputPath, result, "utf8");

  if (statSync(outputPath).size === 0) {
    throw new Error(`Expected non-empty scan output for format: ${format}`);
  }

  process.stdout.write(`Verified fixture output for ${format}: ${outputPath}\n`);
}
