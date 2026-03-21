// XPath sinks: expression passed to evaluate/select. Tainted input on the expression argument is XPath injection.

export const XPATH_SINK_METHODS = new Set([
  "evaluate",
  "select",
  "select1",
  "evaluateWithContext",
]);

// document.evaluate, xpath.select, etc.
export const XPATH_OBJECTS = new Set(["document", "xpath", "dom", "libxmljs"]);

export function getXpathSinkCallee(
  objName: string,
  methodName: string
): string | null {
  if (!XPATH_SINK_METHODS.has(methodName)) return null;
  if (XPATH_OBJECTS.has(objName)) return `${objName}.${methodName}`;
  return null;
}
