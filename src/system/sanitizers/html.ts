// HTML/XSS sanitizers: escape functions that neutralize HTML.

export const HTML_SANITIZER_CALLS = new Set([
  "escape",
  "escapeHtml",
  "escapeHtmlEntities",
  "validator.escape",
  "sanitize",
  "sanitizeHtml",
  "encodeURIComponent",
]);
