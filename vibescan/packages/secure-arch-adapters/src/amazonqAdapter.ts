import type { AdapterInitOptions, AdapterResult } from "./types.js";

const PROMPT = (settingsDir: string) => `# Amazon Q / universal assistant — architecture settings collector

## Scope
Only edit files under: \`${settingsDir}/\`

## Task
Maintain YAML settings that describe deployment and architecture facts:
- Database exposure (internal / vpc / internet / unknown)
- Authentication and authorization model
- Secrets handling (vault, KMS, env — never paste secret values)
- CORS and public ingress
- Storage public vs private
- Environment isolation (dev/staging/prod)
- Trust boundaries (frontend → DB, public → admin)
- Service-to-service IAM / network allowlists

## Rules
- Do not perform security analysis in this prompt path; run \`npx secure-arch check\` for validation.
- If uncertain, set fields to \`unknown\`.
`;

export function initAmazonQAdapter(opts: AdapterInitOptions): AdapterResult {
  const settingsDir = opts.settingsRelativeDir.replace(/\\/g, "/");
  return {
    files: [
      {
        relativePath: "docs/secure-arch/amazon-q-prompt.md",
        content: PROMPT(settingsDir),
      },
    ],
    note: "See docs/secure-arch/README.md in this repo for full portable usage; attach amazon-q-prompt.md when using Amazon Q.",
  };
}
