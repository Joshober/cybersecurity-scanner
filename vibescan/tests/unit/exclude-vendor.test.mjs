import { describe, it } from "node:test";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectScanFiles } from "../../dist/system/cli/collectFiles.js";

describe("collectScanFiles / excludeVendor", () => {
  it("excludes node_modules and minified files when excludeVendor is set", () => {
    const root = mkdtempSync(join(tmpdir(), "vibescan-vendor-"));
    writeFileSync(join(root, "keep.js"), "1");
    mkdirSync(join(root, "node_modules", "pkg"), { recursive: true });
    writeFileSync(join(root, "node_modules", "pkg", "skip.js"), "1");
    writeFileSync(join(root, "app.min.js"), "min");

    const all = collectScanFiles([root], {});
    assert.ok(all.some((p) => p.endsWith("keep.js")));
    assert.ok(all.some((p) => p.includes("node_modules")));

    const ex = collectScanFiles([root], { excludeVendor: true });
    assert.ok(ex.some((p) => p.endsWith("keep.js")));
    assert.ok(!ex.some((p) => p.includes("node_modules")));
    assert.ok(!ex.some((p) => p.endsWith("app.min.js")));
  });
});
