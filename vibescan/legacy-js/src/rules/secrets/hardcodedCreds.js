import * as t from "@babel/types";
import { traverse, forEachParsedFile, nodeLine, snippetForNode } from "../utils.js";
import { TIER1 } from "../../secrets/core-dict.js";
import { TIER2 } from "../../secrets/llm-dict.js";
import { shouldSkipHighEntropySecret } from "../../secrets/entropy.js";

const DICT = new Set([...TIER1, ...TIER2].map((s) => s.toLowerCase()));

const RE_AWS = /AKIA[0-9A-Z]{16}/g;
const RE_APIKEY = /(api_key|apikey|api_secret)\s*=\s*["']([^"']{10,})/gi;
const RE_MONGO = /mongodb:\/\/[^:]+:[^@]+@/gi;
const RE_PEM = /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/;

const NAME_RE = /jwt_secret|session_secret|secret_key|password|api_key/i;

export const ruleSec001 = {
  id: "RULE-SEC-001",
  cwe: "CWE-798",
  owasp: "A02:2021",
  severity: "critical",
  detect(ctx) {
    /** @type {import('../../types.js').Finding[]} */
    const out = [];
    forEachParsedFile(ctx, ({ path: filePath, source, ast }) => {
      for (const m of source.matchAll(RE_AWS)) {
        out.push({
          ruleId: "RULE-SEC-001",
          message: "Possible hardcoded AWS access key pattern.",
          cwe: "CWE-798",
          owasp: "A02:2021",
          severity: "critical",
          file: filePath,
          line: source.slice(0, m.index).split("\n").length,
          snippet: m[0].slice(0, 24) + "...",
        });
      }
      let m;
      while ((m = RE_APIKEY.exec(source)) !== null) {
        out.push({
          ruleId: "RULE-SEC-001",
          message: "Possible hardcoded API key assignment.",
          cwe: "CWE-798",
          owasp: "A02:2021",
          severity: "high",
          file: filePath,
          line: source.slice(0, m.index).split("\n").length,
          snippet: m[0].slice(0, 80),
        });
      }
      RE_APIKEY.lastIndex = 0;

      while ((m = RE_MONGO.exec(source)) !== null) {
        out.push({
          ruleId: "RULE-SEC-001",
          message: "MongoDB connection string with embedded credentials.",
          cwe: "CWE-798",
          owasp: "A02:2021",
          severity: "critical",
          file: filePath,
          line: source.slice(0, m.index).split("\n").length,
          snippet: "mongodb://...",
        });
      }

      if (RE_PEM.test(source)) {
        out.push({
          ruleId: "RULE-SEC-001",
          message: "PEM private key material in source.",
          cwe: "CWE-798",
          owasp: "A02:2021",
          severity: "critical",
          file: filePath,
          line: 1,
          snippet: "BEGIN ... PRIVATE KEY",
        });
      }

      traverse(ast, {
        VariableDeclarator(path) {
          const id = path.node.id;
          const init = path.node.init;
          if (!t.isIdentifier(id) || !NAME_RE.test(id.name)) return;
          if (!t.isStringLiteral(init)) return;
          const val = init.value;
          if (shouldSkipHighEntropySecret(val)) return;
          if (!DICT.has(val.toLowerCase())) return;
          out.push({
            ruleId: "RULE-SEC-001",
            message: `Variable ${id.name} assigned a weak/example secret string.`,
            cwe: "CWE-798",
            owasp: "A02:2021",
            severity: "high",
            file: filePath,
            line: nodeLine(path.node),
            snippet: snippetForNode(source, path.node),
          });
        },
      });
    });
    return out;
  },
};
