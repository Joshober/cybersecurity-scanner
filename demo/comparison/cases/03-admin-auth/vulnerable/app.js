const express = require("express");
const app = express();

app.post("/admin/users", (req, res) => {
  res.send("ok");
});

module.exports = { app };
