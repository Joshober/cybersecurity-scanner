const express = require("express");
const app = express();

app.get("/api/items/:id", (req, res) => res.json({}));
app.post("/api/items", (req, res) => res.json({}));
app.get("/internal/hidden", (req, res) => res.json({}));
