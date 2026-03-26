// Path sanitizers: path.join, path.normalize, resolve with base. path.join(BASE, userInput) is treated as potentially safe when BASE is a literal.

export const PATH_SAFE_METHODS = new Set([
  "path.join",
  "path.normalize",
  "path.resolve",
]);
