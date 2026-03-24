#!/usr/bin/env node
/**
 * Minimal red-team runner: POST each line of prompts.adversarial.jsonl to a configurable HTTP endpoint.
 * Expects JSON body shape { "prompt": "<text>" } unless you edit buildBody() for your API.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

function buildBody(prompt) {
  return JSON.stringify({ prompt });
}

async function main() {
  loadDotEnv();
  const url = process.env.REDFLAGS_LLM_ENDPOINT;
  const apiKey = process.env.REDFLAGS_LLM_API_KEY;
  if (!url) {
    console.error("Set REDFLAGS_LLM_ENDPOINT (see .env.example) or pass via environment.");
    process.exit(2);
  }

  const jsonlPath = join(__dirname, "prompts.adversarial.jsonl");
  const lines = readFileSync(jsonlPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const headers = { "content-type": "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      console.error("Skip invalid JSONL:", line.slice(0, 80));
      continue;
    }
    const prompt = row.prompt;
    if (typeof prompt !== "string") continue;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: buildBody(prompt),
    });
    const text = await res.text();
    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;
    console.log(JSON.stringify({ id: row.id, category: row.category, status: res.status, preview }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
