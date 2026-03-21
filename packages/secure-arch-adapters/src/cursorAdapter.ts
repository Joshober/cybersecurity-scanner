import type { AdapterInitOptions, AdapterResult } from "./types.js";

const RULE_CONTENT = (settingsDir: string) => `---
description: Secure architecture — fill YAML settings only (no security decisions in-chat)
globs:
  - "${settingsDir}/**/*"
alwaysApply: false
---

# Universal secure-architecture settings (portable)

You MUST only create or update files under \`${settingsDir}/\`.

## Do
- Populate \`settings.global.yaml\` and per-environment \`settings.<env>.yaml\` with factual architecture/deployment data (database exposure, auth, secrets storage, CORS, network, storage ACLs, env separation, trust boundaries, service IAM).
- Use the schema documented in \`schema/settings.schema.v1.md\` in this repo (or the template comments).
- Prefer \`unknown\` over guessing.

## Do not
- Do not claim the system is "secure" or "validated" — the \`secure-arch check\` CLI performs static validation.
- Do not embed real secret values; reference secret *names* and storage mechanism only.
`;

export function initCursorAdapter(opts: AdapterInitOptions): AdapterResult {
  const settingsDir = opts.settingsRelativeDir.replace(/\\/g, "/");
  return {
    files: [
      {
        relativePath: ".cursor/rules/secure-arch-settings.mdc",
        content: RULE_CONTENT(settingsDir),
      },
    ],
    note: "Cursor rule file created. Enable rules in Cursor settings if needed.",
  };
}
