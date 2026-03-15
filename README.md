# secure-code-scanner

Static analysis to detect **cryptography failures** and **injection vulnerabilities** in JavaScript/TypeScript. Use it as a standalone CLI or as an ESLint plugin to defend your application before runtime.

---

## Why defend with this tool?

- **OWASP Top 10** — Cryptographic failures (A02:2021) and injection (A03:2021) are among the most critical application risks. Finding them early reduces blast radius and fix cost.
- **Shift-left defense** — Catches risky patterns at build time or in the editor, not only in production. Fits into CI and pre-commit hooks.
- **High-confidence, actionable output** — Reports include *why* something is risky and *how* to fix it, so developers can remediate without guessing.
- **No runtime dependency** — Pure static analysis (plus optional AI). No agents or probes in production; the defense happens in the pipeline.

---

## What it defends against

| Category | Examples |
|----------|----------|
| **Crypto** | Weak hashes (MD5, SHA-1), weak/deprecated ciphers, fixed IVs, `Math.random()` for secrets, hardcoded secrets, env fallback secrets, `rejectUnauthorized: false` |
| **Injection** | SQL/NoSQL from string concat or user input, command injection, path traversal, XSS (`innerHTML`/`document.write`), XPath injection, log injection |

The engine tracks **taint flow**: when untrusted data (e.g. `req.query`, `req.body`, `process.env`) reaches a dangerous **sink** (e.g. `db.query`, `child_process.exec`, `fs.readFile`) without going through a **sanitizer**, it reports a finding. Pattern rules also flag dangerous APIs and crypto misuse even when taint is not tracked.

---

## Install

```bash
npm install secure-code-scanner
```

Requires **Node 18+**.

---

## Build

```bash
npm run build
```

---

## Test

```bash
npm run test
```

Runs `npm run build` then the unit test suite. For faster iteration when `dist/` is already up to date, use `npm run test:only` (tests only, no rebuild).

---

## Usage

### CLI

Run the scanner on paths (files or directories):

```bash
npx secure scan .
npx secure scan src --rules injection,crypto
npx secure scan . --format human --fix-suggestions
```

Or use the binary after install:

```bash
./node_modules/.bin/secure scan .
```

**Options:**

| Option | Description |
|--------|-------------|
| `--mode static` | Rule-based AST checks (default). |
| `--mode ai` | Send code to an LLM for additional analysis (requires API key). |
| `--rules crypto,injection` | Enable rule categories (default: both). |
| `--no-crypto` | Disable cryptography rules. |
| `--no-injection` | Disable injection rules. |
| `--severity <level>` | Only report this and above: `critical`, `error`, `warning`, `info`. |
| `--format human \| compact \| json` | Output format. `human` includes Why + Fix. |
| `--fix-suggestions` | Include fix guidance in output. |
| `--ai-api-url`, `--ai-api-key`, `--ai-model` | AI mode: endpoint, key, model (or set `SECURE_AI_API_URL`, `SECURE_AI_API_KEY`). |

### ESLint plugin

Use the same rules inside ESLint so the same defenses run in the editor and in lint CI:

```javascript
// eslint.config.js (or .eslintrc)
import eslintPluginSecureCodeScanner from "secure-code-scanner";

export default [
  {
    plugins: { "secure-code-scanner": eslintPluginSecureCodeScanner },
    rules: {
      // Enable all secure-code-scanner rules
      ...Object.fromEntries(
        Object.keys(eslintPluginSecureCodeScanner.rules).map((id) => [`secure-code-scanner/${id}`, "error"])
      ),
    },
  },
];
```

---

## How to defend your application

1. **CI** — Add `npx secure scan .` (or `npm exec secure scan .`) to your build or a dedicated security job. Fail the build on `critical` or `error` findings.
2. **Pre-commit** — Run the scanner on staged files to block obviously risky code from being committed.
3. **ESLint** — Integrate the plugin so developers see findings in the editor and in `eslint` CI.
4. **Severity** — Use `--severity error` or `--severity critical` to focus on the highest-impact issues first.
5. **Fix guidance** — Use `--format human` or `--fix-suggestions` so every finding comes with clear remediation steps.

---

## Scope and limitations

- **High-confidence detection** — The tool is tuned to report patterns that are likely real issues, with explanations and fix guidance. It does not promise to find every possible vulnerability or prove code is safe.
- **JavaScript/TypeScript** — Targets JS/TS source. Other languages or minified/bundled output are out of scope.
- **Static + optional AI** — Static analysis cannot see runtime data or every code path; AI mode can help but depends on the configured model and prompt. Use as one layer in a broader defense strategy (secure design, dependency scanning, testing, runtime controls).

Using this scanner helps defend your application by surfacing crypto and injection risks early, with clear guidance to fix them.

---

## License

MIT.
