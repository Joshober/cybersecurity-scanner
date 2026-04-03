import { existsSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import fg from "fast-glob";
import picomatch from "picomatch";
import type { ScannerOptions } from "../types.js";
import { VENDOR_EXCLUDE_GLOBS, pathMatchesVendorExclude } from "../vendorIgnore.js";

const SCAN_EXTENSIONS = ["**/*.js", "**/*.ts", "**/*.mjs", "**/*.cjs", "**/*.tsx", "**/*.jsx"];

/**
 * Resolve scan targets to absolute file paths (directories expanded via fast-glob).
 */
export function collectScanFiles(inputPaths: string[], options: ScannerOptions): string[] {
  const ignore = [
    ...(options.excludeVendor ? VENDOR_EXCLUDE_GLOBS : []),
    ...(options.ignoreGlobs ?? []),
  ];
  const ignoreOpt = ignore.length ? ignore : undefined;

  const files: string[] = [];
  for (const p of inputPaths) {
    const resolved = resolve(p);
    if (existsSync(resolved)) {
      try {
        const stat = statSync(resolved);
        if (stat.isFile()) {
          files.push(resolved);
        } else if (stat.isDirectory()) {
          const found = fg.sync(SCAN_EXTENSIONS, {
            cwd: resolved,
            absolute: true,
            ignore: ignoreOpt,
          });
          files.push(...found);
        }
      } catch {
        const matched = fg.sync(p, { absolute: true, ignore: ignoreOpt });
        files.push(...matched);
      }
    } else {
      const matched = fg.sync(p, { absolute: true, ignore: ignoreOpt });
      files.push(...matched);
    }
  }

  let out = [...new Set(files)];
  if (options.excludeVendor) {
    out = out.filter((f) => !pathMatchesVendorExclude(f));
  }
  const globs = options.ignoreGlobs;
  if (globs?.length) {
    const root = resolve(options.projectRoot ?? process.cwd());
    out = out.filter((abs) => !matchesIgnoreGlobs(abs, root, globs));
  }
  return out;
}

function matchesIgnoreGlobs(absPath: string, projectRoot: string, globs: string[]): boolean {
  let rel = relative(projectRoot, absPath).replace(/\\/g, "/");
  if (rel.startsWith("..")) rel = absPath.replace(/\\/g, "/");
  return globs.some((g) => picomatch(g, { dot: true })(rel));
}
