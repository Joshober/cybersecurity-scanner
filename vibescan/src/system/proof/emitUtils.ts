/** Safe file basename for test output. */
export function safeProofName(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80);
}

/** Safe inside block comments. */
export function escapeBlockComment(s: string): string {
  return s.replace(/\*\//g, "* /").replace(/\r\n/g, "\n");
}

/** Safe inside single-quoted JS string literals in emitted tests. */
export function escapeSingleQuoted(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
