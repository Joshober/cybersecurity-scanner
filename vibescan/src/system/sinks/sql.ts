// SQL sinks: methods that execute SQL. Tainted input on the query string is SQL injection.
// Method names that execute raw SQL (e.g. db.query, client.execute).
export const SQL_SINK_METHODS = new Set([
  "query",
  "execute",
  "exec",
  "run",
  "raw",
  "queryRaw",
  "executeRaw",
]);

// Returns the SQL sink callee (e.g. db.query) or null.
export function getSqlSinkCallee(
  objName: string,
  methodName: string
): string | null {
  if (!SQL_SINK_METHODS.has(methodName)) return null;
  return `${objName}.${methodName}`;
}
