export const XSS_PAYLOADS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "<details open ontoggle=alert(1)>",
  "javascript:alert(1)",
  "'-alert(1)-'",
  "</script><script>alert(1)</script>",
  "<iframe src=javascript:alert(1)>",
] as const;

export const CSRF_TEST = {
  headers: { Origin: "https://evil.attacker.com" },
} as const;
