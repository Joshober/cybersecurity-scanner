import { describe, it } from "node:test";
import assert from "node:assert";
import { runAdapter } from "../dist/index.js";

describe("@secure-arch/adapters", () => {
  it("returns Cursor adapter content", () => {
    const result = runAdapter("cursor", {
      projectRoot: "/tmp/project",
      settingsRelativeDir: "vibescan/architecture/secure-rules",
    });
    assert.strictEqual(result.files.length, 1);
    assert.strictEqual(result.files[0].relativePath, ".cursor/rules/secure-arch-settings.mdc");
    assert.match(result.files[0].content, /Secure architecture/);
  });

  it("returns Amazon Q adapter content", () => {
    const result = runAdapter("amazonq", {
      projectRoot: "/tmp/project",
      settingsRelativeDir: "vibescan/architecture/secure-rules",
    });
    assert.strictEqual(result.files.length, 1);
    assert.strictEqual(result.files[0].relativePath, "docs/secure-arch/amazon-q-prompt.md");
    assert.match(result.files[0].content, /Amazon Q/);
  });
});
