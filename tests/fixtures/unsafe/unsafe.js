const crypto = require("crypto");

// Weak hash - should flag
const hash = crypto.createHash("md5").update("data").digest("hex");

// Insecure RNG - should flag
const token = Math.random().toString(36);

// SQL concatenation - should flag
function getUser(name) {
  return db.query("SELECT * FROM users WHERE name = '" + name + "'");
}

// eval - should flag
eval("console.log(1)");

// Hardcoded secret - should flag
const config = { apiKey: "sk_live_1234567890abcdef" };
