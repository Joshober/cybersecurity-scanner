export type SupportedTool = "cursor" | "amazonq";

export interface AdapterInitOptions {
  /** Repository root (where architecture/ lives). */
  projectRoot: string;
  /** Relative path to settings directory from project root. */
  settingsRelativeDir: string;
}

export interface AdapterFile {
  /** Absolute or relative path segments from project root. */
  relativePath: string;
  content: string;
}

export interface AdapterResult {
  files: AdapterFile[];
  /** Optional human-readable note. */
  note?: string;
}
