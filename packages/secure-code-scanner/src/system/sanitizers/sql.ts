// SQL sanitizers: parameterized queries and safe APIs. Sink called with placeholder literal and second-arg array is treated as sanitized.
// Heuristic: query is parameterized if literal has placeholders (?, $1) and a second argument (values array). Taint engine checks this.
export const PARAMETERIZED_INDICATORS = ["?", "$1", "$2", "${"];

export function looksParameterized(queryLiteral: string, hasSecondArg: boolean): boolean {
  if (!hasSecondArg) return false;
  return PARAMETERIZED_INDICATORS.some((p) => queryLiteral.includes(p));
}
