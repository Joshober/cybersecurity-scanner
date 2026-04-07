import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | undefined;

export function readPackageVersion(): string {
  if (cached !== undefined) return cached;
  try {
    const pkgPath = join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    cached = pkg.version ?? "0.0.0";
  } catch {
    cached = "0.0.0";
  }
  return cached;
}
