import fs from "node:fs";
import path from "node:path";

/**
 * @typedef {Object} RegistryFinding
 * @property {string} ruleId
 * @property {string} message
 * @property {string} [cwe]
 * @property {string} owasp
 * @property {'high'|'medium'|'low'|'info'} severity
 * @property {string} packageName
 */

/**
 * @param {string} packageJsonPath
 * @returns {Promise<RegistryFinding[]>}
 */
export async function checkDependencies(packageJsonPath) {
  /** @type {RegistryFinding[]} */
  const out = [];
  let raw;
  try {
    raw = fs.readFileSync(packageJsonPath, "utf8");
  } catch {
    return out;
  }
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return out;
  }

  const rootDir = path.dirname(path.resolve(packageJsonPath));
  const npmrc = tryReadNpmrc(path.join(rootDir, ".npmrc"));
  if (npmrc && /@.*:registry=/i.test(npmrc)) {
    return out;
  }

  if (pkg.workspaces) {
    return out;
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const name of Object.keys(deps)) {
    const spec = deps[name];
    if (typeof spec !== "string") continue;
    if (spec.startsWith("file:") || spec.startsWith("link:") || spec.startsWith("workspace:")) continue;

    const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    let status = 0;
    try {
      const res = await fetch(registryUrl, { method: "HEAD", redirect: "follow" });
      status = res.status;
    } catch {
      continue;
    }

    if (status === 404) {
      if (name.startsWith("@")) {
        out.push({
          ruleId: "SLOP-001",
          message: `POSSIBLY_PRIVATE: scoped package 404 on public registry — ${name}@${spec}`,
          owasp: "A06:2021",
          severity: "low",
          packageName: name,
        });
      } else {
        out.push({
          ruleId: "SLOP-001",
          message: `SLOPSQUAT_CANDIDATE: package 404 on registry.npmjs.org — ${name}@${spec}`,
          owasp: "A06:2021",
          severity: "high",
          packageName: name,
        });
      }
    }
  }

  return out;
}

/**
 * @param {string} p
 */
function tryReadNpmrc(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}
