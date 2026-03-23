// Seeded positive: string-built query from request-like input (expect injection.sql.string-concat or taint).
const express = require("express");
const app = express();
app.get("/q", (req, res) => {
  const id = req.query.id;
  const q = "SELECT * FROM users WHERE id = '" + id + "'";
  res.send(q);
});
module.exports = app;
