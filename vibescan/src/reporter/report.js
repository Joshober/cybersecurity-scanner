import chalk from "chalk";

const SEV_COLOR = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
};

/**
 * @param {import('../types.js').Finding[]} findings
 */
export function hasCritical(findings) {
  return findings.some((f) => f.severity === "critical");
}

/**
 * @param {import('../types.js').Finding[]} findings
 */
export function formatJson(findings) {
  return JSON.stringify(findings, null, 2);
}

/**
 * @param {import('../types.js').Finding[]} findings
 */
export function formatHuman(findings) {
  if (!findings.length) {
    return chalk.green("No findings.");
  }
  const lines = [chalk.bold("VibeScan findings\n")];
  for (const f of findings) {
    const col = SEV_COLOR[f.severity] ?? chalk.white;
    lines.push(
      col(`[${f.severity.toUpperCase()}] ${f.ruleId}`) +
        ` ${f.file}:${f.line}\n` +
        chalk.dim(f.message) +
        (f.snippet ? `\n  ${chalk.cyan(f.snippet)}` : "") +
        "\n"
    );
  }
  return lines.join("\n");
}
