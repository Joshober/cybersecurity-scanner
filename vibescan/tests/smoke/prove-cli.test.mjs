import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dispatcher = join(root, "src", "system", "cli", "vibescan.ts");

describe("vibescan prove dispatcher", () => {
  it("routes prove to scan with --generate-tests", () => {
    const src = readFileSync(dispatcher, "utf8");
    assert.ok(src.includes('first === "prove"'));
    assert.ok(src.includes("--generate-tests"));
    assert.ok(src.includes("prove --run"));
    assert.ok(src.includes("runProofHarness"));
  });
});
