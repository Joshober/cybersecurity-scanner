// Vulnerable: path from user input to fs.readFile. Should be flagged (path-traversal pattern or taint).
const fs = require("fs");

function handler(req) {
  const path = req.query.file;
  fs.readFile(path, "utf8", (err, data) => {});
}

const userPath = req.params.path;
fs.readFileSync(userPath);
