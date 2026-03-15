// Should trigger: injection.path-traversal (path from variable used in readFile)
import fs from "fs";

function readUserFile(path) {
  return fs.readFileSync(path, "utf-8");
}

function handler(req) {
  const file = req.query.file;
  return fs.readFileSync(file, "utf-8");
}
