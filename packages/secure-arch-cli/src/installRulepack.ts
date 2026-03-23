import { copyFileSync, mkdirSync, readdirSync, existsSync, cpSync } from "node:fs";
import { join } from "node:path";
import { getTemplatesDir, getSchemaDir } from "@secure-arch/core";

export interface InstallOptions {
  projectRoot: string;
  settingsRelativeDir: string;
  force: boolean;
}

export function installRulepack(opts: InstallOptions): { copied: string[]; skipped: string[] } {
  const settingsDir = join(opts.projectRoot, opts.settingsRelativeDir);
  mkdirSync(settingsDir, { recursive: true });

  const templatesDir = getTemplatesDir();
  const names = readdirSync(templatesDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".md"));
  const copied: string[] = [];
  const skipped: string[] = [];

  for (const name of names) {
    const src = join(templatesDir, name);
    const dest = join(settingsDir, name);
    if (existsSync(dest) && !opts.force) {
      skipped.push(dest);
      continue;
    }
    copyFileSync(src, dest);
    copied.push(dest);
  }

  const schemaSrc = getSchemaDir();
  const schemaDest = join(settingsDir, "schema");
  if (opts.force || !existsSync(schemaDest)) {
    mkdirSync(schemaDest, { recursive: true });
    cpSync(schemaSrc, schemaDest, { recursive: true });
    copied.push(schemaDest);
  } else {
    skipped.push(schemaDest);
  }

  return { copied, skipped };
}
