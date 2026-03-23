/**
 * VulnLab — intentional vulnerabilities for static analysis benchmarks.
 * Do not deploy. See GROUND_TRUTH.md for expected rule IDs.
 */
"use strict";

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const child_process = require("child_process");
const https = require("https");
const ip = require("ip");
const _ = require("lodash");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MW-004: permissive CORS
app.use(cors({ origin: "*" }));

// Fake DB surface for SQL concat rule
const db = {
  query(sql, cb) {
    cb(null, []);
  },
};

/** AUTH-003 / MW-002: sensitive route, no auth / no rate limit */
app.post("/api/login", (req, res) => {
  const userId = req.body.userId;
  db.query(`SELECT * FROM users WHERE id = ${userId}`, () => {});
  res.json({ token: "x" });
});

/** AUTH-004: admin-style path without auth middleware */
app.post("/admin/roles", (req, res) => {
  res.json({ ok: true });
});

/** WEBHOOK-001: webhook path uses body without verification hints */
app.post("/webhooks/stripe", (req, res) => {
  const payload = req.body;
  res.json({ ok: true, echo: payload });
});

/** injection.command — template must be the exec() argument for the pattern rule */
app.post("/api/run", (req, res) => {
  child_process.exec(`echo ${req.body.name}`, () => res.send("ok"));
});

/** injection.path-traversal */
app.get("/api/file", (req, res) => {
  const p = path.join("/data", req.query.name);
  fs.readFile(p, "utf8", (err, data) => {
    if (err) return res.status(500).send("err");
    res.send(data);
  });
});

/** injection.eval */
app.post("/api/dyn", (req, res) => {
  const r = eval(req.body.expr);
  res.json({ r });
});

/** crypto.hash.weak */
app.post("/api/digest", (req, res) => {
  const h = crypto.createHash("md5").update(req.body.data).digest("hex");
  res.json({ h });
});

/** crypto.random.insecure */
app.get("/api/token-weak", (req, res) => {
  res.json({ t: Math.random().toString(36) });
});

/** crypto.secrets.hardcoded */
app.get("/api/config", (req, res) => {
  res.json({ apiKey: "sk_live_not_really_but_looks_like_key" });
});

/** SEC-004 style weak fallback */
app.get("/api/session-secret", (req, res) => {
  const s = process.env.SESSION_SECRET || "changeme";
  res.json({ secret: s });
});

/** crypto.jwt.weak-secret-literal + crypto.jwt.weak-secret-verify */
app.post("/api/jwt-issue", (req, res) => {
  const token = jwt.sign({ sub: 1 }, "secret");
  res.json({ token });
});

app.post("/api/jwt-check", (req, res) => {
  try {
    const out = jwt.verify(req.body.token, "secret");
    res.json({ out });
  } catch (e) {
    res.status(400).json({ err: String(e) });
  }
});

/** crypto.tls.reject-unauthorized */
app.get("/api/insecure-fetch", (req, res) => {
  https
    .get("https://example.com", { rejectUnauthorized: false }, (r) => {
      res.status(200).send("ok");
    })
    .on("error", () => res.status(500).send("err"));
});

/** SSRF-003: ip.isPublic gates fetch on same URL variable (anti-pattern demo) */
app.get("/api/proxy", (req, res) => {
  const urlTarget = req.query.url;
  if (ip.isPublic(urlTarget)) {
    fetch(urlTarget).then(() => res.send("ok"));
  } else {
    res.status(400).send("blocked");
  }
});

/** RULE-PROTO-001: merge user body */
app.post("/api/merge-profile", (req, res) => {
  const profile = {};
  Object.assign(profile, req.body);
  res.json(profile);
});

/** RULE-PROTO-001: lodash set with attacker path */
app.post("/api/deep-set", (req, res) => {
  const cfg = {};
  _.set(cfg, req.body.pathKey, req.body.value);
  res.json(cfg);
});

/** injection.log */
app.post("/api/log", (req, res) => {
  console.log(req.body.message);
  res.send("ok");
});

const PORT = process.env.PORT || 4100;
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`VulnLab listening on ${PORT}`);
  });
}

module.exports = { app };
