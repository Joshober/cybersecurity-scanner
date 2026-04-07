import { describe, it } from "node:test";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { scanProject } from "../../dist/system/scanner.js";

function withTempProject(files, run, options = {}) {
  const root = mkdtempSync(join(tmpdir(), "vibescan-ts-"));
  try {
    const tsconfigRel = options.tsconfigRel ?? "tsconfig.json";
    const tsconfigPath = join(root, tsconfigRel);
    if (options.writeTsconfig !== false) {
      mkdirSync(dirname(tsconfigPath), { recursive: true });
      writeFileSync(
        tsconfigPath,
        JSON.stringify(
          options.tsconfig ?? {
            compilerOptions: {
              target: "ES2020",
              module: "ESNext",
              moduleResolution: "Node",
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
            },
            include: ["**/*.ts", "**/*.tsx"],
          },
          null,
          2
        ),
        "utf-8"
      );
    }

    const entries = [];
    for (const [relativePath, source] of Object.entries(files)) {
      const absolutePath = join(root, relativePath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, source, "utf-8");
      entries.push({ path: absolutePath, source });
    }

    return run({ root, entries, tsconfigPath });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("semantic TypeScript analysis", () => {
  it("follows imported typed wrappers to SQL sinks", () => {
    withTempProject(
      {
        "src/queries.ts": `
declare const db: { query(sql: string): unknown };

export function runUserLookup(id: string) {
  return db.query("SELECT * FROM users WHERE id=" + id);
}
`,
        "src/route.ts": `
import { runUserLookup } from "./queries";

export function handler(req: any) {
  const { id } = req.query;
  return runUserLookup(id as string);
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          injection: true,
          tsAnalysis: "semantic",
        });
        assert.ok(
          project.findings.some((finding) => finding.ruleId === "injection.sql.tainted-flow"),
          `expected semantic wrapper taint finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      }
    );
  });

  it("resolves imported axios aliases with an explicit tsconfig path", () => {
    withTempProject(
      {
        "src/handler.ts": `
import httpClient from "axios";

export function handler(req: any) {
  return httpClient({
    baseURL: "https://example.com",
    url: req.query.path,
  });
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          injection: true,
          tsAnalysis: "semantic",
          tsconfigPath: "config/scan.tsconfig.json",
        });
        assert.ok(
          project.findings.some((finding) => finding.ruleId === "RULE-SSRF-002"),
          `expected axios alias SSRF finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      },
      {
        tsconfigRel: "config/scan.tsconfig.json",
        tsconfig: {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            moduleResolution: "Node",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
          },
          include: ["../src/**/*.ts"],
        },
      }
    );
  });

  it("flags createHash aliases in semantic mode", () => {
    withTempProject(
      {
        "src/hash.ts": `
import { createHash as hash } from "node:crypto";

export function digest(input: string) {
  return hash("md5").update(input).digest("hex");
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          crypto: true,
          injection: false,
          tsAnalysis: "semantic",
        });
        assert.ok(
          project.findings.some((finding) => finding.ruleId === "crypto.hash.weak"),
          `expected weak hash finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      }
    );
  });

  it("follows tsconfig path aliases when resolving typed wrappers", () => {
    withTempProject(
      {
        "src/db/queries.ts": `
declare const db: { query(sql: string): unknown };

export function runUserLookup(id: string) {
  return db.query("SELECT * FROM users WHERE id=" + id);
}
`,
        "src/route.ts": `
import { runUserLookup } from "@db/queries";

export function handler(req: any) {
  return runUserLookup(req.query.id);
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          injection: true,
          tsAnalysis: "semantic",
        });
        assert.ok(
          project.findings.some((finding) => finding.ruleId === "injection.sql.tainted-flow"),
          `expected path-alias wrapper taint finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      },
      {
        tsconfig: {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            moduleResolution: "Node",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            baseUrl: ".",
            paths: {
              "@db/*": ["src/db/*"],
            },
          },
          include: ["src/**/*.ts"],
        },
      }
    );
  });

  it("flags child_process import aliases in semantic mode", () => {
    withTempProject(
      {
        "src/command.ts": `
import { execSync as run } from "node:child_process";

export function handler(dir: string) {
  return run(\`ls \${dir}\`);
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          injection: true,
          tsAnalysis: "semantic",
        });
        assert.ok(
          project.findings.some((finding) => finding.ruleId === "injection.command"),
          `expected command alias finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      }
    );
  });

  it("flags fs import aliases in semantic mode", () => {
    withTempProject(
      {
        "src/read.ts": `
import { readFile as readText } from "node:fs/promises";

export async function handler(userPath: string) {
  return readText(userPath);
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          injection: true,
          tsAnalysis: "semantic",
        });
        assert.ok(
          project.findings.some((finding) => finding.ruleId === "injection.path-traversal"),
          `expected fs alias finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      }
    );
  });

  it("uses semantic types to avoid string-only log findings on numbers", () => {
    withTempProject(
      {
        "src/log.ts": `
export function handler() {
  const status: number = 200;
  console.log(status);
}
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          injection: true,
          tsAnalysis: "semantic",
        });
        assert.ok(
          !project.findings.some((finding) => finding.ruleId === "injection.log"),
          `expected no string-only log finding, got: ${project.findings.map((f) => f.ruleId).join(", ") || "none"}`
        );
      }
    );
  });

  it("extracts typed Next.js handlers wrapped in satisfies expressions", () => {
    withTempProject(
      {
        "app/api/users/route.ts": `
type RouteHandler = (request: any) => Promise<Response>;

export const GET = (async (request) => {
  return new Response(request.nextUrl.pathname);
}) satisfies RouteHandler;
`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          tsAnalysis: "auto",
        });
        assert.ok(
          project.routes.some((route) => route.method === "GET" && route.fullPath === "/api/users"),
          `expected typed Next.js route extraction, got: ${project.routes.map((r) => `${r.method} ${r.fullPath}`).join(", ") || "none"}`
        );
      }
    );
  });

  it("warns and falls back in auto mode when tsconfig is missing", () => {
    withTempProject(
      {
        "src/handler.ts": `export function handler(req: any) { return req.query.id as string; }`,
      },
      ({ root, entries }) => {
        const project = scanProject(entries, {
          projectRoot: root,
          tsAnalysis: "auto",
        });
        assert.ok(project.warnings?.some((warning) => warning.code === "ts.semantic.fallback"));
      },
      { writeTsconfig: false }
    );
  });

  it("fails closed in semantic mode when tsconfig is missing", () => {
    withTempProject(
      {
        "src/handler.ts": `export function handler(req: any) { return req.query.id as string; }`,
      },
      ({ root, entries }) => {
        assert.throws(
          () =>
            scanProject(entries, {
              projectRoot: root,
              tsAnalysis: "semantic",
            }),
          /tsconfig/i
        );
      },
      { writeTsconfig: false }
    );
  });
});
