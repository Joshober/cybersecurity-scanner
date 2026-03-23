import path from "node:path";
import { extractRoutes } from "./extractor/astExtractor.js";
import { rules } from "./rules/index.js";

/**
 * @param {string} dirPath
 * @returns {import('./types.js').ScanContext}
 */
export function buildScanContext(dirPath) {
  const rootDir = path.resolve(dirPath);
  const { routes, files } = extractRoutes(rootDir);
  const astByPath = new Map(files.map((f) => [f.path, f]));
  return { routes, files, astByPath, rootDir };
}

/**
 * @param {import('./types.js').ScanContext} ctx
 * @returns {import('./types.js').Finding[]}
 */
export function runRules(ctx) {
  /** @type {import('./types.js').Finding[]} */
  const findings = [];
  for (const rule of rules) {
    findings.push(...rule.detect(ctx));
  }
  return findings;
}

/**
 * @param {string} dirPath
 */
export function scanDirectory(dirPath) {
  const ctx = buildScanContext(dirPath);
  const findings = runRules(ctx);
  return { ctx, findings };
}
