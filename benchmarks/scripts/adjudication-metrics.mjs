#!/usr/bin/env node
/**
 * Compute TP/FP/FN metrics from adjudication CSV.
 *
 * Expected CSV columns:
 * - reviewerVerdict: tp | fp | fn | ignore
 * - ruleId (optional grouping)
 */

import { readFileSync } from "node:fs";

function usage() {
  return "Usage: node benchmarks/scripts/adjudication-metrics.mjs <adjudication.csv>";
}

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = "";
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    if (ch !== "\r") field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function pct(n) {
  return Number.isFinite(n) ? Number(n.toFixed(4)) : 0;
}

function compute(rows) {
  if (rows.length === 0) throw new Error("Empty CSV.");
  const headers = rows[0];
  const idxVerdict = headers.indexOf("reviewerVerdict");
  const idxRule = headers.indexOf("ruleId");
  if (idxVerdict === -1) throw new Error('Missing "reviewerVerdict" column.');

  let tp = 0;
  let fp = 0;
  let fn = 0;
  let ignored = 0;
  let unlabeled = 0;
  const perRule = {};

  for (const r of rows.slice(1)) {
    const v = String(r[idxVerdict] ?? "").trim().toLowerCase();
    const rule = idxRule >= 0 ? String(r[idxRule] ?? "unknown") : "unknown";
    perRule[rule] = perRule[rule] ?? { tp: 0, fp: 0, fn: 0 };
    if (!v) {
      unlabeled += 1;
      continue;
    }
    if (v === "ignore") {
      ignored += 1;
      continue;
    }
    if (v === "tp") {
      tp += 1;
      perRule[rule].tp += 1;
      continue;
    }
    if (v === "fp") {
      fp += 1;
      perRule[rule].fp += 1;
      continue;
    }
    if (v === "fn") {
      fn += 1;
      perRule[rule].fn += 1;
      continue;
    }
    unlabeled += 1;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    totals: { tp, fp, fn, ignored, unlabeled },
    metrics: { precision: pct(precision), recall: pct(recall), f1: pct(f1) },
    perRule,
  };
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error(usage());
    process.exit(2);
  }
  const rows = parseCsv(readFileSync(csvPath, "utf-8"));
  const out = compute(rows);
  console.log(JSON.stringify(out, null, 2));
  if (out.totals.unlabeled > 0) process.exitCode = 1;
}

main();
