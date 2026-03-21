// Safe: literal path only. Should NOT be flagged.
const fs = require("fs");
fs.readFile("/etc/config.json", "utf8", (err, data) => {});
