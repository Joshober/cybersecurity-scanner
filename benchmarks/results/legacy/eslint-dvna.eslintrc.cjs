// DVNA benchmark — from repo root: npx eslint -c benchmarks/results/legacy/eslint-dvna.eslintrc.cjs dvna/
module.exports = {
  root: true,
  env: { node: true, es2021: true },
  plugins: ["security"],
  extends: ["plugin:security/recommended-legacy"],
  ignorePatterns: ["node_modules/", "docs/"],
};
