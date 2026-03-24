#!/usr/bin/env node
/**
 * Print the exact command/instructions to share so others can pull env from the vault.
 * Run from repo root: npm run env:share
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VAULT_FILE = path.join(ROOT, '.env.vault');

if (!fs.existsSync(VAULT_FILE)) {
  console.error('No .env.vault found at repo root. Create one first (see docs/DOTENV_VAULT.md).');
  process.exit(1);
}

const content = fs.readFileSync(VAULT_FILE, 'utf8');
const match = content.match(/DOTENV_VAULT="(vlt_[a-f0-9]+)"/);
if (!match) {
  console.error('Could not find DOTENV_VAULT="vlt_..." in .env.vault');
  process.exit(1);
}

const key = match[1];

console.log(`
Share this with your team (e.g. paste into Slack or a password manager):

--- copy below ---

To pull env keys for this project:

1. Clone the repo and run: npm install
2. One-time setup (register the vault key):
   npx dotenv-vault@latest new ${key}
3. Pull keys:
   - Production (deploy / prod-like local):  npm run env:vault-pull
   - Development (local dev):                npm run env:vault-pull:dev

--- copy above ---
`);
