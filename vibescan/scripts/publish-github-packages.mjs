/**
 * Publish @joshober/vibescan to GitHub Packages (npm.pkg.github.com).
 * GitHub's "Packages" tab only lists packages published to this registry, not npmjs.org.
 *
 * Prerequisites:
 * - GitHub CLI: https://cli.github.com/
 * - Logged in: gh auth login
 * - Token can publish packages. If publish fails with 403, run:
 *     gh auth refresh -s write:packages -h github.com
 * - Scope must match your GitHub username (see `gh api user --jq .login`); use lowercase in package name (e.g. @joshober/...).
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

let token;
try {
  token = execSync("gh auth token", { encoding: "utf8" }).trim();
} catch {
  console.error("Could not run `gh auth token`. Install GitHub CLI and run `gh auth login`.");
  process.exit(1);
}

if (!token) {
  console.error("Empty token from `gh auth token`.");
  process.exit(1);
}

process.env.NODE_AUTH_TOKEN = token;

execSync("npm publish --userconfig .npmrc.github-packages --access public", {
  stdio: "inherit",
  env: process.env,
});
