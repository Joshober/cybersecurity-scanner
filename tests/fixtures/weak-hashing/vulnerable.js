/**
 * Vulnerable: weak hash (MD5). Should be flagged (crypto.hash.weak).
 */

const crypto = require("crypto");
const hash = crypto.createHash("md5").update("data").digest("hex");
