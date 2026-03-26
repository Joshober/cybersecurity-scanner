// Environment and process sources: process.env, process.argv. Often used in config; can be untrusted in some contexts.

export const ENV_SOURCE_NAMES = new Set(["process.env", "process.argv"]);

export function isEnvSource(calleeOrMember: string): boolean {
  if (ENV_SOURCE_NAMES.has(calleeOrMember)) return true;
  if (calleeOrMember === "process" || calleeOrMember === "env") return true;
  return false;
}
