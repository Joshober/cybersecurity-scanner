/**
 * @typedef {import('@babel/types').File} BabelFile
 */

/**
 * Join Express-style path prefixes (string segments).
 * @param {string} base
 * @param {string} segment
 * @returns {string}
 */
export function joinPaths(base, segment) {
  if (!segment || segment === "/") {
    return base || "/";
  }
  const b = (base || "").replace(/\/+$/, "") || "";
  const s = segment.startsWith("/") ? segment : `/${segment}`;
  if (!b) return s;
  return `${b}${s}`;
}

/**
 * Extract `:id` style params from a path pattern.
 * @param {string} pathPattern
 * @returns {string[]}
 */
export function extractPathParams(pathPattern) {
  const re = /:([A-Za-z_][\w-]*)/g;
  const out = [];
  let m;
  while ((m = re.exec(pathPattern))) {
    out.push(m[1]);
  }
  return out;
}

/**
 * @param {object} partial
 * @returns {import('../types.js').RouteRecord}
 */
export function normalizeRoute(partial) {
  const path = partial.path ?? "/";
  const fullPath = partial.fullPath ?? path;
  return {
    method: partial.method ?? "GET",
    path,
    fullPath,
    params: partial.params ?? extractPathParams(fullPath),
    queryParams: partial.queryParams ?? [],
    bodyFields: partial.bodyFields ?? [],
    reqParamFields: partial.reqParamFields ?? [],
    middlewares: partial.middlewares ?? [],
    file: partial.file,
    line: partial.line ?? 0,
    handlerSource: partial.handlerSource ?? "",
    handlerNode: partial.handlerNode,
    routerVar: partial.routerVar,
  };
}
