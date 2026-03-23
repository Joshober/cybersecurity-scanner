// Safe crypto: SHA-256, randomBytes, no hardcoded secrets. Should NOT be flagged.
const crypto = require("crypto");
const hash = crypto.createHash("sha256").update("data").digest("hex");
const token = crypto.randomBytes(32).toString("hex");
const apiKey = process.env.API_KEY;
