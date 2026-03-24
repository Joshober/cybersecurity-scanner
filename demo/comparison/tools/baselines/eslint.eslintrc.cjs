/** ESLint + eslint-plugin-security for comparison cases (run from repo root so the plugin resolves). */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  plugins: ["security"],
  extends: ["plugin:security/recommended-legacy"],
  ignorePatterns: ["**/node_modules/**", "**/fixed/**"],
};
