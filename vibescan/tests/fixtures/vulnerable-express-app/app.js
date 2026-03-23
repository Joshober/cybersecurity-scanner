import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import _ from "lodash";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const db = { query() {} };

app.get("/api/login", (req, res) => {
  res.send(req.query.msg);
});

app.post("/api/users", (req, res) => {
  db.query(`SELECT * FROM u WHERE id = '${req.body.id}'`);
  res.json({ ok: 1 });
});

app.get("/file", (req, res) => {
  const fs = require("node:fs");
  fs.readFile(req.query.path, () => {});
});

app.post("/run", (req, res) => {
  const { exec } = require("node:child_process");
  exec(req.body.cmd, () => {});
});

app.get("/fetch", (req, res) => {
  fetch(req.query.url).then(() => res.send("ok"));
});

app.post("/merge", (req, res) => {
  _.merge({}, req.body);
  res.json({ ok: 1 });
});

app.post("/set", (req, res) => {
  _.set({}, req.body.path, 1);
  res.json({ ok: 1 });
});

app.get("/doc/:id", (req, res) => {
  const User = { findById() {} };
  User.findById(req.params.id).then(() => res.json({}));
});

app.post("/token", (req, res) => {
  const t = jwt.sign({ u: 1 }, process.env.JWT_SECRET || "supersecretkey");
  res.cookie("sid", t);
  res.json({ t });
});

app.post("/eval", (req, res) => {
  eval(req.body.code);
  res.send("ok");
});

export default app;
