/** Prototype pollution payloads for rules and generated tests (chain-inspection oracle). */

export const PROTO_JSON_PAYLOAD = { __proto__: { polluted: true } } as const;

/** Legacy export name — same as PROTO_JSON_PAYLOAD. */
export const PROTO_PAYLOADS_JSON = PROTO_JSON_PAYLOAD;

export const PROTO_PATH_PAYLOADS = [
  "__proto__.isAdmin",
  "constructor.prototype.shell",
  "__proto__.polluted",
] as const;

/** Legacy export — same paths (includes extra chain example). */
export const PROTO_PAYLOADS_PATH = PROTO_PATH_PAYLOADS;

/** Form-encoded prototype pollution probe. */
export const PROTO_FORM_PAYLOAD = "__proto__[polluted]=true" as const;
