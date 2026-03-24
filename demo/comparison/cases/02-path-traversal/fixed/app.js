const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

const root = path.join(__dirname, "data");

app.get("/file", (req, res) => {
  if (String(req.query.name || "") !== "doc") {
    res.status(400).send("bad key");
    return;
  }
  res.send(fs.readFileSync(path.join(root, "hello.txt"), "utf8"));
});

module.exports = { app };
