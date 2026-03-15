// Express/HTTP request sources: untrusted user input (req.query, req.body, req.params, req.headers, req.cookies).
// Property names that indicate request/user input.
export const REQUEST_INPUT_PROPERTIES = new Set([
  "body",
  "query",
  "params",
  "headers",
  "cookies",
  "param",
]);

// Object names that are typically the request object.
export const REQUEST_OBJECT_NAMES = new Set(["req", "request", "ctx", "context"]);

// Returns a request source label (e.g. req.query.name, req.body.id) when the member is a request source.
export function getRequestSourceLabel(
  objectName: string,
  propertyName: string,
  subProperty?: string
): string | null {
  if (!REQUEST_OBJECT_NAMES.has(objectName)) return null;
  if (!REQUEST_INPUT_PROPERTIES.has(propertyName)) return null;
  if (subProperty !== undefined) return `${objectName}.${propertyName}.${subProperty}`;
  return `${objectName}.${propertyName}`;
}
