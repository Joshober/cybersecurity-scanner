const express = require("express");
const rateLimit = require("express-rate-limit");
const app = express();

const limiter = rateLimit({ windowMs: 60_000, max: 5 });
app.post("/login", limiter, (req, res) => {
  res.send("ok");
});

module.exports = { app };
