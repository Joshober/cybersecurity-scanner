const jwt = require("jsonwebtoken");

function mintToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET required");
  }
  return jwt.sign({ sub: userId }, secret);
}

module.exports = { mintToken };
