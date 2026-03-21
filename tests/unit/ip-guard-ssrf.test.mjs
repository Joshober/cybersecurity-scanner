// SSRF-003: ip.isPublic / ip.isPrivate gating outbound HTTP only.

import { describe, it } from "node:test";
import { scanSource, assertHasRuleId, assertNoRuleId } from "../helpers.mjs";

describe("ip-guard SSRF-003", () => {
  it("finds ip.isPublic guarding fetch with same URL variable", () => {
    assertHasRuleId(
      scanSource(`if (ip.isPublic(url)) { fetch(url); }`),
      "SSRF-003"
    );
  });
  it("finds ip.isPrivate guarding axios.get", () => {
    assertHasRuleId(
      scanSource(`if (ip.isPrivate(target)) { axios.get(target); }`),
      "SSRF-003"
    );
  });
  it("no finding when ip check does not gate HTTP call", () => {
    assertNoRuleId(scanSource(`const ok = ip.isPublic(url);`), "SSRF-003");
  });
  it("no finding for allowlist-style guard without ip package", () => {
    assertNoRuleId(
      scanSource(`if (allowed.has(hostname)) { fetch(url); }`),
      "SSRF-003"
    );
  });
});
