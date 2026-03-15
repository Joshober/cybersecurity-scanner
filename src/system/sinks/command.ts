// Command sinks: child_process methods that run shell commands. Tainted input on the command string is command injection.

export const SHELL_EXEC_METHODS = new Set([
  "exec",
  "execSync",
  "spawn",
  "execFile",
  "execFileSync",
]);

export const CHILD_PROCESS_OBJECTS = new Set([
  "child_process",
  "cp",
  "childProcess",
]);

// Returns the shell sink callee (e.g. child_process.exec) when the call is a command sink.
export function getCommandSinkCallee(
  objName: string,
  methodName: string
): string | null {
  if (!SHELL_EXEC_METHODS.has(methodName)) return null;
  if (CHILD_PROCESS_OBJECTS.has(objName)) return `${objName}.${methodName}`;
  return null;
}
