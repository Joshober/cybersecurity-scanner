// Shared HS256 JWT primitives for local proof-oriented tests (no network).

import { createHmac, timingSafeEqual } from "node:crypto";

export function b64urlJson(obj: object): string {
  return Buffer.from(JSON.stringify(obj), "utf8")
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function forgeHs256(payload: object, secret: string): string {
  const headerPart = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payloadPart = b64urlJson(payload);
  const data = `${headerPart}.${payloadPart}`;
  const sig = createHmac("sha256", secret)
    .update(data, "utf8")
    .digest("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${sig}`;
}

/** Verify HS256 token with secret (same construction as forge). */
export function verifyHs256Accepts(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [h, p, sig] = parts;
  const data = `${h}.${p}`;
  const expected = createHmac("sha256", secret)
    .update(data, "utf8")
    .digest("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
}
