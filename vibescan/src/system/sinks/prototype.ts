// Prototype pollution sinks: deep merge / path set with user-controlled input.

/** lodash-style _.merge(dest, src) — user taint typically in second argument. */
export function getPrototypeMergeSink(
  objName: string,
  methodName: string
): { label: string; taintedArgIndex: number } | null {
  const mergeMethods = new Set(["merge", "mergeWith", "defaultsDeep"]);
  if ((objName === "_" || objName === "lodash") && mergeMethods.has(methodName)) {
    return { label: `${objName}.${methodName}`, taintedArgIndex: 1 };
  }
  return null;
}

export function getImportedPrototypeMergeSink(
  importSource: string | undefined,
  methodName: string
): { label: string; taintedArgIndex: number } | null {
  if (!importSource) return null;
  const mergeMethods = new Set(["merge", "mergeWith", "defaultsDeep"]);
  if ((importSource === "lodash" || importSource === "lodash-es") && mergeMethods.has(methodName)) {
    return { label: `${importSource}.${methodName}`, taintedArgIndex: 1 };
  }
  return null;
}

export function isDeepmergeCallee(calleeName: string): boolean {
  return calleeName === "deepmerge" || calleeName === "deepMerge";
}

/** _.set(obj, path, value) — path string is index 1. */
export function getLodashSetSink(
  objName: string,
  methodName: string
): { label: string; taintedArgIndex: number } | null {
  if ((objName === "_" || objName === "lodash") && methodName === "set") {
    return { label: `${objName}.set`, taintedArgIndex: 1 };
  }
  return null;
}

export function getImportedLodashSetSink(
  importSource: string | undefined,
  methodName: string
): { label: string; taintedArgIndex: number } | null {
  if ((importSource === "lodash" || importSource === "lodash-es") && methodName === "set") {
    return { label: `${importSource}.set`, taintedArgIndex: 1 };
  }
  return null;
}
