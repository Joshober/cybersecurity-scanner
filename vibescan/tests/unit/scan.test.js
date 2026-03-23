import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanDirectory } from "../../src/scan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vulnerableDir = path.join(__dirname, "../fixtures/vulnerable-express-app");
const cleanDir = path.join(__dirname, "../fixtures/clean-express-app");

describe("scanDirectory", () => {
  test("vulnerable fixture yields critical findings", () => {
    const { findings } = scanDirectory(vulnerableDir);
    expect(findings.some((f) => f.severity === "critical")).toBe(true);
    expect(findings.some((f) => f.ruleId === "RULE-INJ-001")).toBe(true);
  });

  test("clean fixture has fewer findings than vulnerable", () => {
    const a = scanDirectory(vulnerableDir).findings.length;
    const b = scanDirectory(cleanDir).findings.length;
    expect(b).toBeLessThan(a);
  });
});
