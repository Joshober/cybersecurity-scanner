// Expanded benchmark seeds: one vulnerable anchor per line-tagged statement.
const crypto = require("crypto");
const cp = require("child_process");
const fs = require("fs");
const ejs = require("ejs");
const ip = require("ip");
const jwt = require("jsonwebtoken");
function expandedSeeds(req, res, db, User, sanitizer, logger, axios) {
  eval(req.query.code); // CASE: injection.eval
  db.query("SELECT * FROM users WHERE id=" + req.query.id); // CASE: injection.sql.string-concat
  cp.execSync(`ls ${req.query.dir}`); // CASE: injection.command
  res.redirect(req.query.url); // CASE: injection.open-redirect
  unserialize(req.body.payload); // CASE: injection.deserialize.untrusted
  fs.readFile(req.query.path, "utf8", () => {}); // CASE: injection.path-traversal
  document.evaluate(req.query.xpath, document, null, 0, null); // CASE: injection.xpath
  logger.info(req.body.msg); // CASE: injection.log
  User.findOne({ $where: req.query.filter }); // CASE: injection.noql
  User.findOne({ where: { email: req.body.email } }); // CASE: injection.orm.request-in-query
  res.cookie("sid", "abc", { httpOnly: false, secure: false }); // CASE: mw.cookie.missing-flags
  el.innerHTML = req.query.html; // CASE: injection.xss
  const url = req.query.url; if (ip.isPublic(url)) fetch(url); // CASE: SSRF-003
  axios({ baseURL: "https://example.com", url: req.path }); // CASE: RULE-SSRF-002
  res.render(req.query.view, { a: 1 }); // CASE: injection.ssti.template-user-input
  User.findByPk(req.params.id); // CASE: authz.idor.direct-object-reference
  crypto.createCipher("aes192", "pw"); // CASE: crypto.cipher.deprecated
  crypto.createCipheriv("aes-256-cbc", req.body.key, "0000000000000000"); // CASE: crypto.cipher.fixed-iv
  crypto.createCipheriv("des-ede3", req.body.key, req.body.iv); // CASE: crypto.cipher.weak
  Math.random(); // CASE: crypto.random.insecure
  crypto.createHash("md5").update(req.query.login).digest("hex"); // CASE: crypto.hash.weak
  jwt.sign({ uid: 1 }, "password"); // CASE: crypto.jwt.weak-secret-literal
  const cfg = { rejectUnauthorized: false }; // CASE: crypto.tls.reject-unauthorized
  const auth = process.env.JWT_SECRET || "changeme"; // CASE: SEC-004
  const appCfg = { sessionSecret: "supersecretkey123" }; // CASE: crypto.secrets.hardcoded
  sanitizer.bypassSecurityTrustScript(req.body.script); // CASE: injection.xss.angular-sanitizer-bypass
  ejs.render(req.body.template, { user: req.user }); // CASE: injection.ssti.template-user-input
}
