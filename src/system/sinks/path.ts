// File system sinks: fs methods that take a path. Tainted input on the path argument can be path traversal.

export const FILE_READ_METHODS = new Set([
  "readFile",
  "readFileSync",
  "readdir",
  "readdirSync",
  "createReadStream",
  "existsSync",
  "writeFile",
  "writeFileSync",
  "unlink",
  "unlinkSync",
]);

export const FS_OBJECTS = new Set(["fs", "fsPromises", "require"]);

// Returns the path sink callee (e.g. fs.readFile) when the call is a path sink.
export function getPathSinkCallee(
  objName: string,
  methodName: string
): string | null {
  if (!FILE_READ_METHODS.has(methodName)) return null;
  if (FS_OBJECTS.has(objName)) return `${objName}.${methodName}`;
  return null;
}
