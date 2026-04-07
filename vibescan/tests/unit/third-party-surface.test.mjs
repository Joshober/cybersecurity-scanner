import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanProject } from "../../dist/system/scanner.js";

describe("third-party dependency surface", () => {
  let root;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "vibescan-depsurface-"));
  });

  afterEach(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  function writeWorkspacePackage(name) {
    const dir = join(root, "packages", "internal");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version: "1.0.0" }, null, 2), "utf-8");
  }

  function writeRootPackageJson(extra = {}) {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "depsurface-fixture",
          private: true,
          workspaces: ["packages/*"],
          dependencies: {
            axios: "^1.0.0",
            express: "^4.0.0",
            mysql: "^2.0.0",
          },
          ...extra,
        },
        null,
        2
      ),
      "utf-8"
    );
  }

  it("classifies workspace imports separately from third-party packages", () => {
    writeRootPackageJson();
    writeWorkspacePackage("@acme/internal");

    const source = `
import axios from 'axios';
import helper from '@acme/internal';
import fs from 'node:fs';
console.log(axios, helper, fs);
`;

    const project = scanProject([{ path: join(root, "src", "imports.js"), source }], { projectRoot: root });
    const surface = project.thirdPartySurface;
    assert.ok(surface, "expected thirdPartySurface on project result");
    assert.ok(surface.packages.some((pkg) => pkg.packageName === "axios"));
    assert.ok(!surface.packages.some((pkg) => pkg.packageName === "@acme/internal"));
    assert.ok(!surface.packages.some((pkg) => pkg.packageName === "node:fs" || pkg.packageName === "fs"));
  });

  it("links external packages to sensitive routes and finding touchpoints", () => {
    writeRootPackageJson();

    const source = `
const express = require('express');
const mysql = require('mysql');
const app = express();
app.post('/api/login', (req, res) => {
  mysql.query("SELECT * FROM users WHERE id=" + req.query.id);
  res.send('ok');
});
`;

    const project = scanProject([{ path: join(root, "app.js"), source }], { projectRoot: root });
    const surface = project.thirdPartySurface;
    assert.ok(surface, "expected thirdPartySurface");
    const mysqlPkg = surface.packages.find((pkg) => pkg.packageName === "mysql");
    assert.ok(mysqlPkg, "expected mysql package in third-party surface");
    assert.ok(
      mysqlPkg.routeTouchpoints.some((touchpoint) => touchpoint.fullPath === "/api/login"),
      "expected mysql route touchpoint on /api/login"
    );
    assert.ok(
      mysqlPkg.findingTouchpoints.some((touchpoint) => touchpoint.ruleId.startsWith("injection.sql")),
      "expected mysql finding touchpoint for SQL finding"
    );
    assert.ok(
      surface.reviewFindings.some((finding) => finding.ruleId === "third_party.route.sensitive-touchpoint"),
      "expected sensitive-route review finding"
    );
    assert.ok(
      surface.reviewFindings.some((finding) => finding.ruleId === "third_party.flow.tainted-package-touchpoint"),
      "expected tainted-flow review finding"
    );
  });
});
