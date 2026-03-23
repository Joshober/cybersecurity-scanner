import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Package root (contains templates/, schema/). */
export function getPackageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

export function getTemplatesDir(): string {
  return join(getPackageRoot(), "templates");
}

export function getSchemaDir(): string {
  return join(getPackageRoot(), "schema");
}
