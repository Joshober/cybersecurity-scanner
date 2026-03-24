const express = require("express");
const fs = require("fs");
const app = express();

app.get("/file", (req, res) => {
  const name = req.query.name;
  const p = "./data/" + name;
  res.send(fs.readFileSync(p, "utf8"));
});

module.exports = { app };
