const express = require("express");
const app = express();

function requireAuth(req, res, next) {
  next();
}

app.post("/admin/users", requireAuth, (req, res) => {
  res.send("ok");
});

module.exports = { app };
