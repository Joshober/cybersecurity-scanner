// Seeded positive: weak hash (expect crypto.hash.weak).
const crypto = require("crypto");
const h = crypto.createHash("md5");
h.update("x");
module.exports = h.digest("hex");
