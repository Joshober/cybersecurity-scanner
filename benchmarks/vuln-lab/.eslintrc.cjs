// Local eslint baseline for VulnLab (same plugin stack as DVNA legacy config).
module.exports = {
  root: true,
  env: { node: true, es2021: true },
  plugins: ["security"],
  extends: ["plugin:security/recommended-legacy"],
  ignorePatterns: ["node_modules/"],
};
