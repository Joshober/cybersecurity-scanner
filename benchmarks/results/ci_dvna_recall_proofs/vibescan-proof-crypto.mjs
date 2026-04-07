// Bundled from VibeScan (local HS256 helpers; no network)
"use strict";
// Shared HS256 JWT primitives for local proof-oriented tests (no network).
Object.defineProperty(exports, "__esModule", { value: true });
exports.b64urlJson = b64urlJson;
exports.forgeHs256 = forgeHs256;
exports.verifyHs256Accepts = verifyHs256Accepts;
const node_crypto_1 = require("node:crypto");
function b64urlJson(obj) {
    return Buffer.from(JSON.stringify(obj), "utf8")
        .toString("base64")
        .replace(/=+$/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}
function forgeHs256(payload, secret) {
    const headerPart = b64urlJson({ alg: "HS256", typ: "JWT" });
    const payloadPart = b64urlJson(payload);
    const data = `${headerPart}.${payloadPart}`;
    const sig = (0, node_crypto_1.createHmac)("sha256", secret)
        .update(data, "utf8")
        .digest("base64")
        .replace(/=+$/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    return `${data}.${sig}`;
}
/** Verify HS256 token with secret (same construction as forge). */
function verifyHs256Accepts(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 3)
        return false;
    const [h, p, sig] = parts;
    const data = `${h}.${p}`;
    const expected = (0, node_crypto_1.createHmac)("sha256", secret)
        .update(data, "utf8")
        .digest("base64")
        .replace(/=+$/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    return (0, node_crypto_1.timingSafeEqual)(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
}
//# sourceMappingURL=jwtHs256Forge.js.map