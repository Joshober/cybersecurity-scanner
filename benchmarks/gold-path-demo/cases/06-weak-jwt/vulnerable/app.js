const jwt = require("jsonwebtoken");

function mintToken(userId) {
  return jwt.sign({ sub: userId }, "secret");
}

module.exports = { mintToken };
