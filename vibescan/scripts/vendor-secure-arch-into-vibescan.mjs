import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** vibescan package root (parent of scripts/). */
const vibescanDir = join(__dirname, "..");
const outBase = join(vibescanDir, "dist", "node_modules", "@secure-arch");

const pkgs = [
  {
    pkgDir: join(vibescanDir, "packages", "secure-arch-core"),
    destDir: join(outBase, "core"),
    extraDirs: ["templates", "schema"],
  },
  {
    pkgDir: join(vibescanDir, "packages", "secure-arch-adapters"),
    destDir: join(outBase, "adapters"),
    extraDirs: [],
  },
  {
    pkgDir: join(vibescanDir, "packages", "secure-arch-cli"),
    destDir: join(outBase, "cli"),
    extraDirs: [],
  },
];

function requireExists(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required path: ${path}`);
  }
}

rmSync(outBase, { recursive: true, force: true });
mkdirSync(outBase, { recursive: true });

for (const p of pkgs) {
  requireExists(p.pkgDir);
  requireExists(join(p.pkgDir, "package.json"));

  const distSrc = join(p.pkgDir, "dist");
  requireExists(distSrc);

  for (const extra of p.extraDirs) requireExists(join(p.pkgDir, extra));

  rmSync(p.destDir, { recursive: true, force: true });
  mkdirSync(p.destDir, { recursive: true });

  cpSync(join(p.pkgDir, "package.json"), join(p.destDir, "package.json"));
  cpSync(distSrc, join(p.destDir, "dist"), { recursive: true });

  for (const extra of p.extraDirs) {
    cpSync(join(p.pkgDir, extra), join(p.destDir, extra), { recursive: true });
  }
}

console.log(`Vendored secure-arch packages into: ${outBase}`);
