import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BEGIN = "# BEGIN secure-arch generated ignores";
const END = "# END secure-arch generated ignores";

const DEFAULT_LINES = [".env", ".env.*", "!.env.example", "*.pem", "*.key", "*.p12"];

export function ensureGitignorePatterns(projectRoot: string, extraLines: string[] = []): { changed: boolean; path: string } {
  const gitignorePath = join(projectRoot, ".gitignore");
  const blockLines = [...new Set([...DEFAULT_LINES, ...extraLines])].sort();
  const blockBody = [BEGIN, ...blockLines, END].join("\n");

  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, `${blockBody}\n`, "utf-8");
    return { changed: true, path: gitignorePath };
  }

  const prev = readFileSync(gitignorePath, "utf-8");
  if (prev.includes(BEGIN) && prev.includes(END)) {
    const re = new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}`, "m");
    const next = prev.replace(re, blockBody);
    if (next !== prev) {
      writeFileSync(gitignorePath, next, "utf-8");
      return { changed: true, path: gitignorePath };
    }
    return { changed: false, path: gitignorePath };
  }

  const next = prev.replace(/\s*$/, "") + `\n\n${blockBody}\n`;
  writeFileSync(gitignorePath, next, "utf-8");
  return { changed: true, path: gitignorePath };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
