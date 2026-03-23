import crypto from "crypto";

const hash = crypto.createHash("md5").update("data").digest("hex");
const token = Math.random().toString(36);

function getUser(name) {
  return db.query("SELECT * FROM users WHERE name = '" + name + "'");
}

eval("console.log(1)");

const config = { apiKey: "sk_live_1234567890abcdef" };
