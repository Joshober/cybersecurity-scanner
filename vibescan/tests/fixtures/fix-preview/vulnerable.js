const crypto = require("crypto");
crypto.createHash("md5").update("x").digest("hex");
