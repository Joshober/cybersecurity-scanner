# Cybersecurity Scanner

Static analysis to detect **cryptography failures** and **injection vulnerabilities** in JavaScript/TypeScript. Use it as a standalone CLI or as an ESLint plugin to defend your application before runtime.

**Repository:** [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner)

---

## Why use this tool?

- **OWASP Top 10** — Cryptographic failures (A02:2021) and injection (A03:2021) are among the most critical application risks. Finding them early reduces blast radius and fix cost.
- **Shift-left defense** — Catches risky patterns at build time or in the editor, not only in production. Fits into CI and pre-commit hooks.
- **High-confidence, actionable output** — Reports include *why* something is risky and *how* to fix it.
- **No runtime dependency** — Pure static analysis (plus optional AI). No agents in production; the defense runs in your pipeline.

---

## What it detects

| Category | Examples |
|----------|----------|
| **Crypto** | Weak hashes (MD5, SHA-1), weak/deprecated ciphers, fixed IVs, `Math.random()` for secrets, hardcoded secrets, env fallback secrets, `rejectUnauthorized: false` |
| **Injection** | SQL/NoSQL from string concat or user input, command injection, path traversal, XSS (`innerHTML`/`document.write`), XPath injection, log injection |

The engine tracks **taint flow**: when untrusted data (e.g. `req.query`, `req.body`) reaches a dangerous **sink** (e.g. `db.query`, `child_process.exec`, `fs.readFile`) without sanitization, it reports a finding. Pattern rules also flag dangerous APIs and crypto misuse.

---

## Install

From the repo (clone and build):

```bash
git clone https://github.com/Joshober/cybersecurity-scanner.git
cd cybersecurity-scanner
npm install
npm run build
```

Requires **Node 18+**.

---

## Build

```bash
npm run build
```

Output is in `dist/`. The package entry is `dist/system/index.js`.

---

## Test

```bash
npm run test
```

Runs `npm run build` then the unit test suite. For faster iteration when `dist/` is up to date:

```bash
npm run test:only
```

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
| `--ai-api-url`, `--ai-api-key`, `--ai-model` | AI mode (or set `SECURE_AI_API_URL`, `SECURE_AI_API_KEY`). |

### ESLint plugin

Use the same rules inside ESLint:

```javascript
// eslint.config.js (or .eslintrc)
import eslintPluginSecureCodeScanner from "secure-code-scanner";

export default [
  {
    plugins: { "secure-code-scanner": eslintPluginSecureCodeScanner },
    rules: {
      ...Object.fromEntries(
        Object.keys(eslintPluginSecureCodeScanner.rules).map((id) => [`secure-code-scanner/${id}`, "error"])
      ),
    },
  },
];
```

---

## Project structure

```
src/
├── attacks/           # Rule definitions by category
│   ├── crypto/        # Hashing, ciphers, secrets, TLS
│   ├── injection/     # SQL, command, NoSQL, XPath, log
│   ├── browser/       # XSS
│   ├── file/          # Path traversal
│   └── index.ts
└── system/            # Engine, CLI, and shared code
    ├── ai/            # Optional LLM-based analysis
    ├── cli/           # secure scan CLI
    ├── engine/        # Rule engine + taint engine
    ├── parser/        # AST parsing
    ├── sanitizers/    # SQL, path, HTML
    ├── sinks/         # SQL, command, path, XPath, log
    ├── sources/       # Express, env
    ├── utils/        # Helpers, rule types
    ├── types.ts
    ├── scanner.ts
    ├── format.ts
    ├── eslint-plugin.ts
    └── index.ts       # Package entry

tests/
├── fixtures/          # Per-category test fixtures (safe/vulnerable)
├── unit/
└── helpers.mjs
```

---

## How to defend your application

1. **CI** — Add `npx secure scan .` to your build or a security job. Fail on `critical` or `error` findings.
2. **Pre-commit** — Run the scanner on staged files.
3. **ESLint** — Use the plugin so developers see findings in the editor and in lint CI.
4. **Severity** — Use `--severity error` or `--severity critical` to focus on high-impact issues.
5. **Fix guidance** — Use `--format human` or `--fix-suggestions` for remediation steps.

---

## Scope and limitations

- **High-confidence detection** — Tuned to report likely real issues with explanations and fix guidance. It does not find every vulnerability or prove code is safe.
- **JavaScript/TypeScript** — Targets JS/TS source. Other languages or minified output are out of scope.
- **Static + optional AI** — Static analysis cannot see all runtime data or code paths; AI mode depends on the configured model. Use as one layer in a broader defense strategy.

---

## License

MIT.
