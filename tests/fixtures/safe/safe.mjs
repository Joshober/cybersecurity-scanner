/**
 * Safe equivalents: parameterized SQL, crypto.randomBytes, strong hash, env for secrets.
 * These patterns should NOT be flagged by the scanner.
 */

import crypto from "crypto";
import path from "path";

// Strong hash
const hash = crypto.createHash("sha256").update("data").digest("hex");

// Secure RNG for token
const token = crypto.randomBytes(32).toString("hex");

// Parameterized query (safe)
function getUser(id) {
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}

// Secret from env, no fallback
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API_KEY required");

// AES-GCM with random IV (safe)
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

// Path: fixed base + normalized (conceptually safe)
const base = "/app/data";
const safePath = path.join(base, path.normalize(relativePath));
