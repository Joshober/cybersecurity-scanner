/**
 * Hermetic fix-preview: requires `patch` or `git apply` in PATH; skips with message when apply fails (CI without patch).
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { scanProject } from "../../dist/system/scanner.js";
import { collectScanFiles } from "../../dist/system/cli/collectFiles.js";
import { formatProjectJson } from "../../dist/system/format.js";
import { runFixPreview, cleanupFixPreviewTemps } from "../../dist/system/cli/fixPreview.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(__dirname, "../fixtures/fix-preview");
const patchPath = join(fixtureRoot, "tail-comment.patch");

describe("fix-preview harness", () => {
  it("runs scan + proofs before/after patch; optional findingDiff with --from + finding-id", (t) => {
    const work = mkdtempSync(join(tmpdir(), "vfp-"));
    try {
      cpSync(fixtureRoot, work, { recursive: true });
      const fromPath = join(work, "saved.json");
      const paths = collectScanFiles([work], { projectRoot: work, excludeVendor: true });
      const files = paths.map((p) => ({ path: p, source: readFileSync(p, "utf-8") }));
      const project = scanProject(files, { projectRoot: work, excludeVendor: true });
      assert.ok(project.findings.length >= 1, "fixture must produce at least one finding");
      writeFileSync(
        fromPath,
        formatProjectJson(project, { benchmarkMetadata: true, includeRuleFamily: true }),
        "utf-8"
      );
      const findingId = JSON.parse(readFileSync(fromPath, "utf-8")).findings[0].findingId;

      let r;
      try {
        r = runFixPreview({
          projectRoot: work,
          patchFile: patchPath,
          fromProjectJson: fromPath,
          findingId,
        });
      } catch (e) {
        const msg = String(e && e.message ? e.message : e);
        if (msg.includes("Could not apply patch")) {
          t.skip(msg);
          return;
        }
        throw e;
      }

      try {
        assert.strictEqual(r.version, 1);
        assert.ok(r.proofLogBefore);
        assert.ok(r.proofLogAfter);
        assert.strictEqual(r.summaryBeforeFindings >= 1, true);
        assert.strictEqual(r.findingId, findingId);
        assert.ok(r.findingDiff, "findingDiff should be set when from + findingId are passed");
        assert.strictEqual(r.findingDiff.lookup, "matched");
        assert.strictEqual(typeof r.findingDiff.resultChanged, "boolean");
      } finally {
        cleanupFixPreviewTemps(r);
      }
    } finally {
      rmSync(work, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });
});
