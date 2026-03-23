import { test } from "node:test";
import assert from "node:assert";
import { validateSettingsDocument } from "../dist/index.js";

test("valid global document", () => {
  const doc = {
    schemaVersion: "1",
    project: { name: "x" },
    environments: {
      production: {
        database: { exposure: "internal" },
      },
    },
  };
  const e = validateSettingsDocument(doc, "t.yaml");
  assert.deepStrictEqual(e, []);
});

test("invalid exposure", () => {
  const doc = {
    environments: {
      prod: { database: { exposure: "public-internet" } },
    },
  };
  const e = validateSettingsDocument(doc, "t.yaml");
  assert.ok(e.some((x) => x.path.includes("database.exposure")));
});

test("partial env file at root", () => {
  const doc = { database: { exposure: "internet" } };
  const e = validateSettingsDocument(doc, "settings.prod.yaml");
  assert.strictEqual(e.length, 0);
});
