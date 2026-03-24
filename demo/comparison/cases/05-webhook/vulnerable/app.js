const express = require("express");
const app = express();

app.post("/webhook", express.raw({ type: "*/*" }), (req, res) => {
  const x = req.body;
  res.send("ok");
});

module.exports = { app };
